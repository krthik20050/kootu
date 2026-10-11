"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GroupResponse,
  LocationResponse,
  MatchResponse,
  ProfileResponse,
  RequestResponse,
  RideRequestInput,
} from "@/lib/api/generated";
import { localTime, message, readable, type Api } from "./shared";
import { UploadAssist } from "./upload-assist";
import { VoicePreferences } from "./voice-preferences";
import { ArrivalCelebration } from "./arrival-celebration";
import { draftFromTicket, emptyPassengerDraft, readyFromArrival, type PassengerDraft } from "@/lib/ticket-draft";
import { TicketReview } from "./ticket-review";

const active = new Set(["WAITING", "MATCHED", "ASSIGNED"]);

export function Passenger({ api, accountName = "" }: { api: Api; accountName?: string }) {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [step, setStep] = useState(0);
  const [ticketRead, setTicketRead] = useState(false);
  const [draftVersion, setDraftVersion] = useState(0);
  const [dictating, setDictating] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [showJourneys, setShowJourneys] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const [flightConfirmed, setFlightConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyPassengerDraft);
  const { readyAt, arrivalAt, ticket, luggageCount, displayName, passengerCount, flight, destination, coordinates } = draft;
  function patchDraft(patch: Partial<PassengerDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }
  const setArrivalAt = (arrivalAt: string) => patchDraft({ arrivalAt, readyAt: readyFromArrival(arrivalAt) });
  const setLuggageCount = (luggageCount: string) => patchDraft({ luggageCount });
  const setDisplayName = (displayName: string) => patchDraft({ displayName });
  const setPassengerCount = (passengerCount: string) => patchDraft({ passengerCount });
  const setFlight = (flight: PassengerDraft["flight"]) => patchDraft({ flight });
  const setDestination = (destination: string) => patchDraft({ destination });
  const setCoordinates = (coordinates: PassengerDraft["coordinates"]) => patchDraft({ coordinates });
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [notes, setNotes] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);

  const load = useCallback(async () => {
    const [me, items] = await Promise.all([
      api<ProfileResponse>("/me"),
      api<RequestResponse[]>("/ride-requests"),
    ]);
    const ids = [
      ...new Set(
        items
          .map((row) => row.group_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const loaded = await Promise.all(
      ids.map((id) => api<GroupResponse>(`/ride-groups/${id}`)),
    );
    return {
      me,
      items,
      groups: Object.fromEntries(loaded.map((group) => [group.id, group])),
    };
  }, [api]);

  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setProfile(data.me);
    setRequests(data.items);
    setGroups(data.groups);
  }, []);

  useEffect(() => {
    let live = true;
    void load()
      .then((data) => {
        if (live) apply(data);
      })
      .catch((error) => {
        if (live) setError(message(error));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const timer = setInterval(() => {
      if (!document.hidden)
        void load()
          .then((data) => {
            if (live) apply(data);
          })
          .catch((error) => {
            if (live) setError(message(error));
          });
    }, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load, apply]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await load().then(apply);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    await run(async () => {
      const results = await api<LocationResponse[]>(
        `/locations/search?q=${encodeURIComponent(destination)}`,
      );
      setLocations(results);
      if (!results.length)
        setNotice(
          "No places found. Try a more specific address, or enter coordinates below.",
        );
    });
  }

  useEffect(() => { heading.current?.focus(); }, [step]);

  function validateStep() {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] input`);
    const invalid = fields && Array.from(fields).find((input) => !input.checkValidity());
    if (invalid) {
      const details = invalid.closest("details");
      if (details) details.open = true;
      invalid.reportValidity();
      return false;
    }
    return true;
  }

  function advance() {
    if (busy || extracting || loading || !profile) return;
    if (!validateStep()) return;
    setError("");
    if (step === 1) setFlightConfirmed(true);
    setStep(step + 1);
  }

  function newArrival() {
    formRef.current?.reset();
    submission.current = null;
    setDraftVersion((version) => version + 1);
    setTicketRead(false);
    setFlightConfirmed(false);
    setDraft(emptyPassengerDraft());
    setLocations([]);
    setNotes("");
    setWomenOnly(false);
    setShowJourneys(false);
    setSavedId("");
    setNotice("");
    setError("");
    setStep(0);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 2) return;
    if (busy || extracting || dictating || notes.length > 2000 || !validateStep()) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "");
    const count = (key: string) => Number(form.get(key));
    if (extracting || !flightConfirmed) {
      setError("Finish reading your ticket and check your flight details before saving.");
      return;
    }
    await run(async () => {
      const ready = new Date(readyAt);
      if (
        !Number.isFinite(ready.getTime()) ||
        !coordinates.latitude ||
        !coordinates.longitude
      )
        throw new Error("Add your flight’s arrival time and choose a destination first.");
      await api<ProfileResponse>("/me", {
        method: "PATCH",
        body: {
          display_name: text("display_name"),
          women_only_eligible: womenOnly && form.get("eligible") === "on",
        },
      });
      const details = {
        airport: flight.airport,
        flight_number: flight.number.trim().toUpperCase().replaceAll(" ", ""),
        flight_date: flight.date,
        ready_at: ready.toISOString(),
        max_wait_minutes: count("max_wait_minutes"),
        destination_name: destination,
        destination: {
          latitude: Number(coordinates.latitude),
          longitude: Number(coordinates.longitude),
        },
        passengers: count("passengers"),
        luggage: count("luggage"),
        women_only: womenOnly,
        wheelchair_spaces: count("wheelchair_spaces"),
        child_seats: count("child_seats"),
        pet_friendly: form.get("pet_friendly") === "on",
        notes,
        flight_details_confirmed: true as const,
      };
      const fingerprint = JSON.stringify(details);
      if (submission.current?.fingerprint !== fingerprint)
        submission.current = { fingerprint, id: crypto.randomUUID() };
      const body: RideRequestInput = {
        ...details,
        client_request_id: submission.current.id,
      };
      const saved = await api<RequestResponse>("/ride-requests", {
        method: "POST",
        body,
      });
      setSavedId(saved.id);
      setStep(3);
      setNotice("Your arrival is saved. Looking for a compatible group…");
      const result = await api<MatchResponse>(
        `/ride-requests/${saved.id}/match`,
        { method: "POST", timeout: 150000 },
      );
      setNotice(
        result.matched
          ? "A group is ready for driver review. Your ride is confirmed when a driver accepts."
          : result.message || "Your request is waiting for company.",
      );
    });
  }

  return (
    <>
      <div className="workspace-title intake-title">
        <p className="eyebrow">YOUR AIRPORT RIDE</p>
        <h1 ref={heading} tabIndex={-1}>
          {["Let’s start with your ticket.", "Everything look right?", "Where should we drop you?", "Your arrival is saved."][step]}
        </h1>
        <p>{["Upload it and we’ll fill in your arrival.", "Check your details, then continue.", "Add your destination and any instructions for your driver.", "We’ll look for people heading your way."][step]}</p>
      </div>
      {step < 3 && <ol className="intake-progress" aria-label="Booking progress">
        {["Ticket", "Arrival", "Your ride"].map((title, index) =>
          <li key={title} aria-current={step === index ? "step" : undefined} className={index <= step ? "reached" : ""}>
            <span>{index < step ? "✓" : index + 1}</span>{title}
          </li>)}
      </ol>}
      <div className={`workspace-grid guided-intake ${step === 3 || showJourneys ? "with-journeys" : ""}`}>
        <section className="booking">
          <div hidden={step > 1}>
            <UploadAssist key={draftVersion} api={api} disabled={busy || loading || !profile} onBusy={setExtracting}
              onTicket={(details) => {
                setDraft(draftFromTicket(details, profile?.display_name || accountName));
                setFlightConfirmed(false);
                setLocations([]);
                setTicketRead(true);
                setStep(1);
              }} />
          </div>
          <div hidden={step !== 0}>
            <div className="step-actions">
              <button type="button" className="text-button" disabled={extracting || loading || !profile} onClick={() => setStep(1)}>Enter details instead</button>
              <button type="button" className="action" disabled={!ticketRead || extracting} onClick={() => setStep(1)}>Next →</button>
            </div>
            {requests.length > 0 && <button type="button" className="text-button" onClick={() => setShowJourneys(!showJourneys)}>{showJourneys ? "Hide saved arrivals" : "View saved arrivals"}</button>}
          </div>
          <form noValidate ref={formRef} hidden={step === 0 || step === 3} onSubmit={(event) => void submit(event)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing && event.target instanceof HTMLInputElement && event.target.type !== "checkbox") event.preventDefault();
            }}>
            <fieldset data-step="1" hidden={step !== 1} disabled={busy || extracting || loading || !profile}>
              <legend className="sr-only">Your arrival</legend>
              <TicketReview details={ticket} airport={flight.airport} number={flight.number}>
              <label>Your name<input name="display_name" value={displayName ?? (profile?.display_name || accountName)} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} autoComplete="name" /></label>
              <div className="form-row">
                <label>Arrival airport<input value={flight.airport} onChange={(event) => { setFlightConfirmed(false); setFlight({ ...flight, airport: event.target.value.toUpperCase() }); }} required pattern="[A-Z]{3}" maxLength={3} /></label>
                <label>Flight number<input value={flight.number} onChange={(event) => { setFlightConfirmed(false); setFlight({ ...flight, number: event.target.value.toUpperCase() }); }} required pattern="[A-Z0-9]{2,3}[0-9]{1,4}" placeholder="AI123" /></label>
              </div>
              <div className="form-row">
                <label>Flight date<input type="date" value={flight.date} onInput={(event) => { setFlightConfirmed(false); setFlight({ ...flight, date: event.currentTarget.value }); }} onChange={(event) => { setFlightConfirmed(false); setFlight({ ...flight, date: event.target.value }); }} required /></label>
                <label>Arrival time · your local time<input type="datetime-local" value={arrivalAt} onInput={(event) => setArrivalAt(event.currentTarget.value)} onChange={(event) => setArrivalAt(event.target.value)} required aria-describedby="pickup-timing" /></label>
              </div>
              <p id="pickup-timing" className="quiet">{readyAt ? `Pickup planned for ${localTime(new Date(readyAt).toISOString())}, allowing 45 minutes after arrival.` : "Arrival time wasn’t found. Add it so we can plan pickup 45 minutes after landing."}</p>
              <div className="form-row">
                <label>Passengers<input name="passengers" type="number" min={1} max={6} value={passengerCount} onChange={(event) => setPassengerCount(event.target.value)} required /></label>
                <label>Luggage pieces<input name="luggage" type="number" min={0} max={6} value={luggageCount} onChange={(event) => setLuggageCount(event.target.value)} required /></label>
              </div>
              </TicketReview>
            </fieldset>
            <fieldset data-step="2" hidden={step !== 2} disabled={busy || extracting || loading || !profile}>
              <legend className="sr-only">Your ride</legend>
              <label>Exact drop-off address<input value={destination} onChange={(event) => { setDestination(event.target.value); setCoordinates({ latitude: "", longitude: "" }); setLocations([]); }} required minLength={3} maxLength={160} placeholder="Building, street and town" /></label>
              <button className="secondary" type="button" onClick={() => void search()} disabled={dictating || destination.trim().length < 3}>Find destination</button>
              {locations.length > 0 && <ul className="location-options">{locations.map((place) =>
                <li key={place.place_id}><button type="button" onClick={() => { setDestination(place.name.slice(0, 160)); setCoordinates({ latitude: String(place.coordinates.latitude), longitude: String(place.coordinates.longitude) }); setLocations([]); }}>{place.name}</button></li>)}</ul>}
              {coordinates.latitude && <p className="quiet">✓ Drop-off selected</p>}
              <details className="manual-location">
                <summary>Enter a map pin instead</summary>
                <div className="form-row">
                  <label>Latitude<input type="number" step="any" min={-90} max={90} value={coordinates.latitude} onChange={(event) => setCoordinates({ ...coordinates, latitude: event.target.value })} /></label>
                  <label>Longitude<input type="number" step="any" min={-180} max={180} value={coordinates.longitude} onChange={(event) => setCoordinates({ ...coordinates, longitude: event.target.value })} /></label>
                </div>
              </details>
              <VoicePreferences key={draftVersion} api={api} value={notes} onChange={setNotes} onBusy={setDictating} />
              <details className="ride-options">
                <summary>Ride preferences & accessibility</summary>
                <label>Maximum wait · minutes<input name="max_wait_minutes" type="number" min={5} max={120} defaultValue={30} required /></label>
                <div className="form-row">
                  <label>Wheelchair spaces<input name="wheelchair_spaces" type="number" min={0} max={2} defaultValue={0} required /></label>
                  <label>Child seats<input name="child_seats" type="number" min={0} max={4} defaultValue={0} required /></label>
                </div>
                <label className="check"><input name="pet_friendly" type="checkbox" />Travelling with a pet</label>
                <label className="check"><input type="checkbox" checked={womenOnly} onChange={(event) => setWomenOnly(event.target.checked)} />Women-only group</label>
                {womenOnly && <label className="check eligibility"><input name="eligible" type="checkbox" required />Every passenger in my party is eligible for a women-only ride.</label>}
                <p className="quiet">Select seat or accessibility needs here so we can match the right vehicle.</p>
              </details>
            </fieldset>
            <div className="step-actions">
              <button className="text-button" type="button" disabled={busy || dictating} onClick={() => setStep(step - 1)}>← Back</button>
              {step === 1 ? <button className="action" key="next" type="button" disabled={busy || extracting || loading || !profile} onClick={(event) => { event.preventDefault(); advance(); }}>Next →</button>
                : <button key="save" type="submit" className="action" disabled={busy || extracting || dictating || loading || !profile || notes.length > 2000}>{busy ? "Saving…" : "Find my ride →"}</button>}
            </div>
          </form>
          {step === 3 && <div className="arrival-success" role="status">
            <ArrivalCelebration />
            <div className="success-mark" aria-hidden="true">✓</div>
            <h2>One step closer.</h2>
            <p>{flight.airport} → {destination}</p>
            <p className="quiet">Your request is saved. Your ride is confirmed when a driver accepts.</p>
            {!busy && savedId && <button className="secondary" type="button" onClick={newArrival}>Add another arrival</button>}
          </div>}
        </section>
        <aside className="ride-list" hidden={step !== 3 && !showJourneys} aria-labelledby="rides-title">
          <div className="aside-title">
            <p className="eyebrow">SAVED ARRIVALS</p>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void run(async () => {})}
            >
              Refresh
            </button>
          </div>
          <h2 id="rides-title">Your journeys</h2>
          {loading && <p role="status">Loading your arrivals…</p>}
          {!loading && !requests.length && (
            <p className="empty">
              Your saved arrivals will appear here, with the group and driver
              status.
            </p>
          )}
          {requests.map((ride) => {
            const group = ride.group_id ? groups[ride.group_id] : undefined;
            return (
              <article className="ride-entry" key={ride.id}>
                <span className="status">{readable(ride.status)}</span>
                <h3>
                  {ride.airport} → {ride.destination_name}
                </h3>
                <p>
                  {localTime(ride.ready_at)} · {ride.passengers} passenger
                  {ride.passengers === 1 ? "" : "s"} · {ride.luggage} luggage
                </p>
                <p className="quiet">
                  Flight {ride.flight_number} · {readable(ride.flight_status)}
                </p>
                {group && (
                  <div className="group-details">
                    <strong>
                      {group.vehicle
                        ? `Vehicle ${group.vehicle.registration}`
                        : "Waiting for driver acceptance"}
                    </strong>
                    <p>
                      {group.passengers} passengers · leave{" "}
                      {localTime(group.departure_at)}
                    </p>
                    <ol>
                      {group.events.slice(-3).map((event, index) => (
                        <li key={`${event.created_at}-${index}`}>
                          {readable(event.kind)}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="entry-actions">
                  {ride.status === "WAITING" && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const result = await api<MatchResponse>(
                            `/ride-requests/${ride.id}/match`,
                            { method: "POST", timeout: 150000 },
                          );
                          setNotice(
                            result.message || "Group sent for driver review.",
                          );
                        })
                      }
                    >
                      Look for a group
                    </button>
                  )}
                  {active.has(ride.status) && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await api(`/ride-requests/${ride.id}/cancel`, {
                            method: "POST",
                          });
                          setNotice("Arrival cancelled.");
                        })
                      }
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </aside>
      </div>
      <div className="workspace-feedback">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </div>
    </>
  );
}
