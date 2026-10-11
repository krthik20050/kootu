"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LocationResponse, ProfileResponse, RequestResponse, RideRequestInput } from "@/lib/api/generated";
import { message, type Api } from "./shared";
import { TicketCamera } from "./ticket-camera";
import { VoiceRecorder } from "./voice-recorder";

type Draft = {
  displayName: string;
  flightNumber: string;
  flightDate: string;
  destinationName: string;
  latitude: string;
  longitude: string;
};

type QuestionKey = "flightNumber" | "flightDate" | "destinationName";
type Question = { key: QuestionKey; prompt: string; helper?: string };
const questions: Question[] = [
  { key: "flightNumber", prompt: "What’s your flight number?", helper: "For example, AI123." },
  { key: "flightDate", prompt: "What date does your flight arrive?" },
  { key: "destinationName", prompt: "Where should the cab drop you off?", helper: "Enter an address and choose a place, or enter a map pin." },
];

export function RequestChat({
  api,
  profile,
  accountName,
  disabled,
  initialRide,
  onSaved,
}: {
  api: Api;
  profile: ProfileResponse | null;
  accountName: string;
  disabled: boolean;
  initialRide?: RequestResponse;
  onSaved?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    displayName: profile?.display_name || accountName,
    flightNumber: initialRide?.flight_number || "",
    flightDate: initialRide?.flight_date || "",
    destinationName: initialRide?.destination_name || "",
    latitude: initialRide ? String(initialRide.destination.latitude) : "",
    longitude: initialRide ? String(initialRide.destination.longitude) : "",
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [manualPin, setManualPin] = useState(false);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeLocation, setActiveLocation] = useState(-1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const feed = useRef<HTMLDivElement | null>(null);
  const [airport, setAirport] = useState(initialRide?.airport || "COK");
  const [pickupTime, setPickupTime] = useState(initialRide ? new Date(initialRide.ready_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "");
  const [passengers, setPassengers] = useState(initialRide?.passengers ?? 1);
  const [luggage, setLuggage] = useState(initialRide?.luggage ?? 1);
  const [maxWait, setMaxWait] = useState(initialRide?.max_wait_minutes ?? 30);
  const [womenOnly, setWomenOnly] = useState(initialRide?.women_only ?? false);
  const [wheelchairs, setWheelchairs] = useState(initialRide?.wheelchair_spaces ?? 0);
  const [childSeats, setChildSeats] = useState(initialRide?.child_seats ?? 0);
  const [pets, setPets] = useState(initialRide?.pet_friendly ?? false);
  const [notes, setNotes] = useState(initialRide?.notes || "");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<RequestResponse | null>(null);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  const saveLock = useRef(false);
  const formDisabled = disabled || saving || !!created;


  const question = questions[stepIndex];
  const doneCount = Math.min(stepIndex, questions.length);
  const progress = questions.length ? Math.round((doneCount / questions.length) * 100) : 0;

  useEffect(() => {
    const container = feed.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [stepIndex]);

  function chooseArrivalDay(offset: number) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    setValue("flightDate", `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  }

  function setValue<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function answerFor(key: QuestionKey): string {
    if (key === "flightNumber") return draft.flightNumber || "Not entered";
    if (key === "flightDate") return draft.flightDate || "Not entered";
    return draft.destinationName || "Not entered";
  }

  function advance() {
    setError("");
    setNotice("");
    setStepIndex((current) => current + 1);
  }

  useEffect(() => {
    if (stepIndex !== 2 || manualPin || draft.latitude || draft.destinationName.trim().length < 3) return;
    let live = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api<LocationResponse[]>(`/locations/search?q=${encodeURIComponent(draft.destinationName.trim())}`);
        if (!live) return;
        setLocations(results);
        setActiveLocation(-1);
        if (!results.length) setNotice("No matching addresses. Add a street or town, or enter a map pin.");
      } catch (caught) {
        if (live) setError(message(caught));
      } finally {
        if (live) setSearching(false);
      }
    }, 400);
    return () => { live = false; clearTimeout(timer); };
  }, [api, draft.destinationName, draft.latitude, manualPin, stepIndex]);

  function selectDestination(place: LocationResponse) {
    setDraft(current => ({ ...current, destinationName: place.name.slice(0, 160), latitude: String(place.coordinates.latitude), longitude: String(place.coordinates.longitude) }));
    setLocations([]); setActiveLocation(-1); setSearching(false); setManualPin(false); setError(""); setNotice("");
  }

  async function saveRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLock.current || formDisabled || !confirmed) return;
    setError(""); setNotice("");
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!draft.latitude || !draft.longitude || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      setError("Select a drop-off suggestion or enter a valid map pin."); return;
    }
    if (!pickupTime || !draft.flightDate) { setError("Enter the arrival date and pickup-ready time."); return; }
    if (wheelchairs > passengers || childSeats > passengers) { setError("Required spaces cannot exceed your passenger count."); return; }
    const ready = new Date(`${draft.flightDate}T${pickupTime}:00+05:30`);
    if (!Number.isFinite(ready.getTime())) { setError("Enter a valid pickup-ready time."); return; }
    if (ready.getTime() < Date.now() - 5 * 60_000 || ready.getTime() > Date.now() + 30 * 86_400_000) {
      setError("Pickup-ready time must be within the next 30 days, and cannot be in the past."); return;
    }
    const details = {
      airport: airport.toUpperCase(), flight_number: draft.flightNumber, flight_date: draft.flightDate,
      ready_at: ready.toISOString(), max_wait_minutes: maxWait,
      destination_name: draft.destinationName, destination: { latitude, longitude },
      passengers, luggage, women_only: womenOnly, wheelchair_spaces: wheelchairs,
      child_seats: childSeats, pet_friendly: pets, notes, flight_details_confirmed: true as const,
    };
    const fingerprint = JSON.stringify(details);
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, id: crypto.randomUUID() };
    const payload: RideRequestInput = { ...details, client_request_id: submission.current.id };
    saveLock.current = true; setSaving(true);
    try {
      const result = await api<RequestResponse>("/ride-requests", { method: "POST", body: payload });
      setCreated(result);
      onSaved?.();
    } catch (caught) { setError(message(caught)); }
    finally { saveLock.current = false; setSaving(false); }
  }

  function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question?.key === "destinationName" && (!draft.latitude || !draft.longitude)) {
      setError("Choose a destination from the search results or enter its map pin.");
      return;
    }
    advance();
  }

  return (
    <section className="request-chat" aria-label="Ride request chat">
      <header className="request-chat-header">
        <div className="request-chat-assistant" aria-hidden="true">k<span /></div>
        <div className="request-chat-heading">
          <strong>Kootu ride assistant</strong>
          <span>One question at a time</span>
        </div>
        <div className="request-chat-progress" aria-label={`${progress}% complete`}>
          <span>{doneCount} of {questions.length}</span>
          <div><span style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <nav className="chat-step-nav" aria-label="Ride request steps">
        {["Flight", "Arrival", "Drop-off"].map((label, index) => (
          <button key={label} type="button" disabled={formDisabled || index > stepIndex} aria-current={index === stepIndex ? "step" : undefined} onClick={() => { setStepIndex(index); setError(""); setNotice(""); }}>
            <span className="chat-step-number">{index < doneCount ? <Check size={12} /> : index + 1}</span>{label}
            {index < 2 && <ChevronRight size={12} aria-hidden="true" />}
          </button>
        ))}
      </nav>

      <div ref={feed} className="request-chat-feed" aria-live="polite">
        <div className="chat-message chat-message-bot">
          <span className="chat-avatar" aria-hidden="true">k</span>
          <p>Hi{draft.displayName ? ` ${draft.displayName.split(" ")[0]}` : ""}. I’ll help put your airport ride request together. Let’s take it one step at a time.</p>
        </div>
        {questions.slice(0, doneCount).map((item, index) => (
          <div className="chat-turn" key={item.key}>
            <div className="chat-message chat-message-bot"><span className="chat-avatar" aria-hidden="true">k</span><p>{item.prompt}</p></div>
            <div className="chat-message chat-message-user"><button type="button" className="chat-answer-edit" disabled={formDisabled} aria-label={`Edit ${item.key === "flightNumber" ? "flight number" : item.key === "flightDate" ? "arrival date" : "drop-off"}: ${answerFor(item.key)}`} onClick={() => { setStepIndex(index); setError(""); setNotice(""); }}><span>{answerFor(item.key)}</span><small>Edit</small></button></div>
          </div>
        ))}
        {question && (
          <div className="chat-message chat-message-bot chat-current-question">
            <span className="chat-avatar" aria-hidden="true">k</span>
            <div><p>{question.prompt}</p>{question.helper && <small>{question.helper}</small>}</div>
          </div>
        )}
        {!question && (
          <div className="chat-message chat-message-bot chat-current-question">
            <span className="chat-avatar" aria-hidden="true">k</span>
            <p>Here are your trip details. You can go back and change an answer.</p>
          </div>
        )}
      </div>

      {question ? (
        <form className="request-chat-answer" onSubmit={handleContinue}>
          <fieldset className="chat-answer-fields" disabled={formDisabled}>
          {initialRide && <p className="chat-notice">Started from a saved request. Submitting creates a new request; it does not update the original.</p>}
          {question.key === "flightNumber" && (
            <label className="chat-input-label">Flight number<input autoComplete="off" required pattern="[A-Za-z0-9]{2,3}[0-9]{1,4}" placeholder="AI123" value={draft.flightNumber} onChange={(event) => setValue("flightNumber", event.target.value.toUpperCase().replaceAll(" ", ""))} /></label>
          )}
          {question.key === "flightDate" && (
            <div><label className="chat-input-label">Arrival date<input type="date" required value={draft.flightDate} onChange={(event) => setValue("flightDate", event.target.value)} /></label><div className="chat-quick-dates"><button type="button" onClick={() => chooseArrivalDay(0)}>Today</button><button type="button" onClick={() => chooseArrivalDay(1)}>Tomorrow</button></div></div>
          )}
          {question.key === "destinationName" && (
            <div className="chat-destination">
              <label className="chat-input-label">Drop-off address<input required minLength={3} maxLength={160} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={locations.length > 0} aria-controls="dropoff-suggestions" aria-activedescendant={activeLocation >= 0 && locations[activeLocation] ? `dropoff-option-${activeLocation}` : undefined} aria-busy={searching} placeholder="Start typing a street, building or town" value={draft.destinationName} onChange={(event) => {
                const value = event.target.value;
                setDraft(current => ({ ...current, destinationName: value, latitude: "", longitude: "" }));
                setLocations([]); setActiveLocation(-1); setManualPin(false); setError(""); setNotice(""); setSearching(value.trim().length >= 3);
              }} onKeyDown={event => {
                if (event.key === "Escape") { setLocations([]); setActiveLocation(-1); }
                if (!locations.length) return;
                if (event.key === "ArrowDown") { event.preventDefault(); setActiveLocation(index => (index + 1) % locations.length); }
                if (event.key === "ArrowUp") { event.preventDefault(); setActiveLocation(index => index <= 0 ? locations.length - 1 : index - 1); }
                if (event.key === "Enter" && activeLocation >= 0) { event.preventDefault(); selectDestination(locations[activeLocation]); }
              }} /></label>
              {searching && <p role="status" className="chat-address-hint">Finding addresses…</p>}
              {!searching && !draft.latitude && draft.destinationName.trim().length < 3 && <p className="chat-address-hint">Type at least 3 characters for Google Maps suggestions.</p>}
              <ul id="dropoff-suggestions" role="listbox" className="chat-location-options" aria-label="Google Maps address suggestions" hidden={!locations.length}>{locations.map((place, index) => (
                <li key={place.place_id} role="presentation"><button id={`dropoff-option-${index}`} role="option" aria-selected={activeLocation === index} type="button" onClick={() => selectDestination(place)}><span>{place.name}</span><span aria-hidden="true">↗</span></button></li>
              ))}</ul>
              {locations.length > 0 && <p className="chat-address-hint">Addresses from Google Maps · Choose your exact drop-off</p>}
              <div className="chat-destination-actions">
                <button className="chat-text-action" type="button" disabled={draft.destinationName.trim().length < 2} onClick={() => {
                  setManualPin(true); setSearching(false); setActiveLocation(-1); setError(""); setNotice("");
                  setDraft(current => ({ ...current, latitude: "", longitude: "" })); setLocations([]);
                }}>Enter a map pin instead</button>
              </div>
              {draft.latitude && <p className="chat-selection">Pin selected · {draft.latitude}, {draft.longitude}</p>}
            </div>
          )}
          {question.key === "destinationName" && manualPin && (
            <div className="form-row">
              <label className="chat-input-label">Latitude<input type="number" required step="any" min={-90} max={90} value={draft.latitude} onChange={(event) => setValue("latitude", event.target.value)} /></label>
              <label className="chat-input-label">Longitude<input type="number" required step="any" min={-180} max={180} value={draft.longitude} onChange={(event) => setValue("longitude", event.target.value)} /></label>
            </div>
          )}
          </fieldset>

          <VoiceRecorder disabled={formDisabled} actions={<TicketCamera api={api} disabled={formDisabled} onTicket={(details) => {
            setDraft((current) => ({
              ...current,
              flightNumber: details.flight_number || current.flightNumber,
              flightDate: details.flight_date || current.flightDate,
            }));
            setStepIndex(0);
            setNotice("Ticket details filled in. Check each answer as you continue.");
          }} />} />

          <div className="request-chat-controls">
            <button type="button" className="chat-back" disabled={stepIndex === 0 || formDisabled} onClick={() => { setError(""); setNotice(""); setStepIndex((current) => Math.max(0, current - 1)); }}>← Back</button>
            <div className="chat-continue-actions">
                <button className="chat-send" disabled={formDisabled || (question.key === "destinationName" && (searching || !draft.latitude || !draft.longitude))}>
                  {question.key === "destinationName" ? "Review details" : "Continue"} <span aria-hidden="true">→</span>
                </button>
            </div>
          </div>
          {error && <p className="chat-error" role="alert">{error}</p>}
          {notice && <p className="chat-notice" role="status">{notice}</p>}
        </form>
      ) : (
        <form className="request-chat-review" onSubmit={event => void saveRequest(event)}>
          <p className="chat-notice">Check your arrival and drop-off, then confirm the pickup details below.</p>
          <dl>{questions.map((item) => (
            <div key={item.key}><dt>{item.prompt}</dt><dd>{answerFor(item.key)}</dd><button type="button" disabled={formDisabled} onClick={() => setStepIndex(questions.findIndex((candidate) => candidate.key === item.key))}>Change</button></div>
          ))}</dl>
          {initialRide && <p className="chat-notice">This creates a new request. An existing active booking for the same airport and arrival date must be cancelled first.</p>}
          <fieldset className="chat-booking-fields" disabled={formDisabled}>
            <legend>Pickup details</legend>
            <div className="form-row">
              <label className="chat-input-label">Airport code<input required pattern="[A-Z]{3}" maxLength={3} value={airport} onChange={event => setAirport(event.target.value.toUpperCase())} /></label>
              <label className="chat-input-label">Pickup-ready time (IST)<input required type="time" value={pickupTime} onChange={event => setPickupTime(event.target.value)} /><small>On {draft.flightDate}, India time (UTC+05:30). Include time for baggage collection.</small></label>
            </div>
            <div className="form-row">
              <label className="chat-input-label">Passengers<input required type="number" min={1} max={8} value={passengers} onChange={event => setPassengers(Number(event.target.value))} /></label>
              <label className="chat-input-label">Bags<input required type="number" min={0} max={12} value={luggage} onChange={event => setLuggage(Number(event.target.value))} /></label>
            </div>
            <label className="chat-input-label">Maximum wait (minutes)<input required type="number" min={5} max={120} value={maxWait} onChange={event => setMaxWait(Number(event.target.value))} /></label>
            <details className="chat-booking-needs"><summary>Accessibility and preferences</summary>
              <label className="chat-booking-check"><input type="checkbox" checked={womenOnly} onChange={event => setWomenOnly(event.target.checked)} />Women-only group</label>
              <div className="form-row"><label className="chat-input-label">Wheelchair spaces<input required type="number" min={0} max={Math.min(2, passengers)} value={wheelchairs} onChange={event => setWheelchairs(Number(event.target.value))} /></label><label className="chat-input-label">Child seats<input required type="number" min={0} max={Math.min(4, passengers)} value={childSeats} onChange={event => setChildSeats(Number(event.target.value))} /></label></div>
              <label className="chat-booking-check"><input type="checkbox" checked={pets} onChange={event => setPets(event.target.checked)} />Travelling with a pet</label>
              <label className="chat-input-label">Notes (optional)<textarea maxLength={500} value={notes} onChange={event => setNotes(event.target.value)} /></label>
            </details>
            <label className="chat-booking-check"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I confirm the flight number, arrival date, airport and pickup details are correct.</label>
          </fieldset>
          {created && <div role="status" className="chat-notice">Request saved · {created.flight_number} to {created.destination_name}. <Link href="/dashboard">View your dashboard →</Link></div>}
          <div className="request-chat-controls">
            <button type="button" className="chat-back" disabled={formDisabled} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>← Back</button>
            <button type="submit" className="chat-send" disabled={formDisabled || !confirmed}>{saving ? "Saving…" : created ? "Request saved" : "Send ride request"}</button>
          </div>
          {error && <p className="chat-error" role="alert">{error}</p>}
          {notice && <p className="chat-notice" role="status">{notice}</p>}
        </form>
      )}


    </section>
  );
}
