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

const active = new Set(["WAITING", "MATCHED", "ASSIGNED"]);

export function Passenger({ api, accountName = "" }: { api: Api; accountName?: string }) {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flight, setFlight] = useState({
    airport: "COK",
    number: "",
    date: "",
  });
  const [destination, setDestination] = useState("");
  const [coordinates, setCoordinates] = useState({
    latitude: "",
    longitude: "",
  });
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "");
    const count = (key: string) => Number(form.get(key));
    await run(async () => {
      const ready = new Date(text("ready_at"));
      if (
        !Number.isFinite(ready.getTime()) ||
        !coordinates.latitude ||
        !coordinates.longitude
      )
        throw new Error("Choose your ready time and destination first.");
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
      <div className="workspace-title">
        <p className="eyebrow">YOUR NEXT LEG</p>
        <h1>
          Where to,
          <br />
          <em>together?</em>
        </h1>
        <p>
          Tell us when you’re ready to leave the airport and where you’re going.
          We’ll look for people heading close by.
        </p>
      </div>
      <div className="workspace-grid">
        <section className="booking">
          <UploadAssist
            api={api}
            onTicket={(details) => {
              setFlight((old) => ({
                airport: details.arrival_airport || old.airport,
                number: details.flight_number || old.number,
                date: details.flight_date || old.date,
              }));
              setNotice(
                "Check the extracted flight details, then confirm them before submitting.",
              );
            }}
            onNote={(note) => {
              setNotes(note);
              setNotice(
                "Notes added. Check any required seats or accessibility options below.",
              );
            }}
          />
          <form onSubmit={(event) => void submit(event)}>
            <fieldset disabled={busy || loading || !profile}>
              <legend>
                <span>01</span> Your arrival
              </legend>
              <label>
                Your name
                <input
                  name="display_name"
                  defaultValue={profile?.display_name || accountName}
                  key={profile?.id}
                  required
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
              <div className="form-row">
                <label>
                  Arrival airport
                  <input
                    value={flight.airport}
                    onChange={(event) =>
                      setFlight({
                        ...flight,
                        airport: event.target.value.toUpperCase(),
                      })
                    }
                    required
                    pattern="[A-Z]{3}"
                    maxLength={3}
                  />
                </label>
                <label>
                  Flight number
                  <input
                    value={flight.number}
                    onChange={(event) =>
                      setFlight({
                        ...flight,
                        number: event.target.value.toUpperCase(),
                      })
                    }
                    required
                    placeholder="AI123"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Flight date
                  <input
                    type="date"
                    value={flight.date}
                    onChange={(event) =>
                      setFlight({ ...flight, date: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Ready to leave
                  <input name="ready_at" type="datetime-local" required />
                </label>
              </div>
              <p className="quiet">
                Use your local time. Allow time for baggage and immigration.
                Flight updates adjust this ready time when a verified arrival
                estimate changes.
              </p>
              <label className="check">
                <input type="checkbox" required />
                I’ve checked the flight number, arrival airport and date.
              </label>
            </fieldset>
            <fieldset disabled={busy || loading || !profile}>
              <legend>
                <span>02</span> Your destination
              </legend>
              <label>
                Exact drop-off address
                <input
                  value={destination}
                  onChange={(event) => {
                    setDestination(event.target.value);
                    setCoordinates({ latitude: "", longitude: "" });
                    setLocations([]);
                  }}
                  required
                  minLength={3}
                  maxLength={160}
                  placeholder="Building, street and town"
                />
              </label>
              <button
                className="secondary"
                type="button"
                onClick={() => void search()}
                disabled={destination.trim().length < 3}
              >
                Find destination
              </button>
              {locations.length > 0 && (
                <ul className="location-options">
                  {locations.map((place) => (
                    <li key={place.place_id}>
                      <button
                        type="button"
                        onClick={() => {
                          setDestination(place.name.slice(0, 160));
                          setCoordinates({
                            latitude: String(place.coordinates.latitude),
                            longitude: String(place.coordinates.longitude),
                          });
                          setLocations([]);
                        }}
                      >
                        {place.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {coordinates.latitude && (
                <p className="quiet">
                  Destination selected: {coordinates.latitude},{" "}
                  {coordinates.longitude}
                </p>
              )}
              <details className="manual-location">
                <summary>Enter coordinates manually</summary>
                <p className="quiet">
                  Use the exact drop-off pin from your map.
                </p>
                <div className="form-row">
                  <label>
                    Latitude
                    <input
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      value={coordinates.latitude}
                      onChange={(event) =>
                        setCoordinates({
                          ...coordinates,
                          latitude: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      value={coordinates.longitude}
                      onChange={(event) =>
                        setCoordinates({
                          ...coordinates,
                          longitude: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </details>
            </fieldset>
            <fieldset disabled={busy || loading || !profile}>
              <legend>
                <span>03</span> Room for your needs
              </legend>
              <div className="form-row">
                <label>
                  Passengers
                  <input
                    name="passengers"
                    type="number"
                    min={1}
                    max={4}
                    defaultValue={1}
                    required
                  />
                </label>
                <label>
                  Luggage pieces
                  <input
                    name="luggage"
                    type="number"
                    min={0}
                    max={4}
                    defaultValue={1}
                    required
                  />
                </label>
                <label>
                  Maximum wait · minutes
                  <input
                    name="max_wait_minutes"
                    type="number"
                    min={5}
                    max={120}
                    defaultValue={30}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Wheelchair spaces
                  <input
                    name="wheelchair_spaces"
                    type="number"
                    min={0}
                    max={2}
                    defaultValue={0}
                    required
                  />
                </label>
                <label>
                  Child seats
                  <input
                    name="child_seats"
                    type="number"
                    min={0}
                    max={4}
                    defaultValue={0}
                    required
                  />
                </label>
              </div>
              <label className="check">
                <input name="pet_friendly" type="checkbox" />
                Travelling with a pet
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={womenOnly}
                  onChange={(event) => setWomenOnly(event.target.checked)}
                />
                Women-only group
              </label>
              {womenOnly && (
                <label className="check eligibility">
                  <input name="eligible" type="checkbox" required />
                  Every passenger in my party is eligible for a women-only ride.
                </label>
              )}
              <label>
                Anything else the driver should know?
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Pickup assistance or other useful details"
                />
              </label>
              <p className="quiet">
                Notes are shared with your assigned driver. Seat and
                accessibility requirements must be selected above; notes alone
                do not change matching.
              </p>
            </fieldset>
            <button className="action" disabled={busy || loading || !profile}>
              {busy
                ? "Saving and finding company…"
                : "Save arrival & find a group ↗"}
            </button>
            <p className="quiet">
              A request is not a confirmed ride. Matching depends on compatible
              passengers and an approved, available driver and vehicle.
            </p>
          </form>
        </section>
        <aside className="ride-list" aria-labelledby="rides-title">
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
