"use client";

import { useState } from "react";
import type { LocationResponse, ProfileResponse } from "@/lib/api/generated";
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
}: {
  api: Api;
  profile: ProfileResponse | null;
  accountName: string;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<Draft>({
    displayName: profile?.display_name || accountName,
    flightNumber: "",
    flightDate: "",
    destinationName: "",
    latitude: "",
    longitude: "",
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [manualPin, setManualPin] = useState(false);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const question = questions[stepIndex];
  const doneCount = Math.min(stepIndex, questions.length);
  const progress = questions.length ? Math.round((doneCount / questions.length) * 100) : 0;

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

  async function searchDestination() {
    if (draft.destinationName.trim().length < 3) return;
    setSearching(true);
    setError("");
    setNotice("");
    try {
      const results = await api<LocationResponse[]>(
        `/locations/search?q=${encodeURIComponent(draft.destinationName)}`,
      );
      setLocations(results);
      if (!results.length) setNotice("No places found. Try a more specific address or enter a map pin instead.");
    } catch (caught) {
      setError(message(caught));
    } finally {
      setSearching(false);
    }
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

      <div className="request-chat-feed" aria-live="polite">
        <div className="chat-message chat-message-bot">
          <span className="chat-avatar" aria-hidden="true">k</span>
          <p>Hi{draft.displayName ? ` ${draft.displayName.split(" ")[0]}` : ""}. I’ll help put your airport ride request together. Let’s take it one step at a time.</p>
        </div>
        {questions.slice(0, doneCount).map((item) => (
          <div className="chat-turn" key={item.key}>
            <div className="chat-message chat-message-bot"><span className="chat-avatar" aria-hidden="true">k</span><p>{item.prompt}</p></div>
            <div className="chat-message chat-message-user"><p>{answerFor(item.key)}</p></div>
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
          <fieldset className="chat-answer-fields" disabled={disabled}>
          {question.key === "flightNumber" && (
            <label className="chat-input-label">Flight number<input autoComplete="off" required pattern="[A-Za-z0-9]{2,3}[0-9]{1,4}" placeholder="AI123" value={draft.flightNumber} onChange={(event) => setValue("flightNumber", event.target.value.toUpperCase().replaceAll(" ", ""))} /></label>
          )}
          {question.key === "flightDate" && (
            <label className="chat-input-label">Arrival date<input type="date" required value={draft.flightDate} onChange={(event) => setValue("flightDate", event.target.value)} /></label>
          )}
          {question.key === "destinationName" && (
            <div className="chat-destination">
              <label className="chat-input-label">Drop-off address<input required minLength={2} maxLength={160} placeholder="Building, street and town" value={draft.destinationName} onChange={(event) => {
                setDraft((current) => ({ ...current, destinationName: event.target.value, latitude: "", longitude: "" }));
                setLocations([]);
              }} /></label>
              <div className="chat-destination-actions">
                <button className="chat-secondary" type="button" disabled={searching || draft.destinationName.trim().length < 3} onClick={() => void searchDestination()}>{searching ? "Searching…" : "Find destination"}</button>
                <button className="chat-text-action" type="button" disabled={draft.destinationName.trim().length < 2} onClick={() => {
                  setManualPin(true);
                  setDraft((current) => ({ ...current, latitude: "", longitude: "" }));
                  setLocations([]);
                }}>Enter a map pin instead</button>
              </div>
              {locations.length > 0 && <ul className="chat-location-options" aria-label="Destination search results">{locations.map((place) => (
                <li key={place.place_id}><button type="button" aria-pressed={draft.destinationName === place.name} onClick={() => {
                  setDraft((current) => ({ ...current, destinationName: place.name.slice(0, 160), latitude: String(place.coordinates.latitude), longitude: String(place.coordinates.longitude) }));
                  setLocations([]);
                  setError("");
                }}><span>{place.name}</span><span aria-hidden="true">↗</span></button></li>
              ))}</ul>}
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

          <VoiceRecorder disabled={disabled} actions={<TicketCamera api={api} disabled={disabled} onTicket={(details) => {
            setDraft((current) => ({
              ...current,
              flightNumber: details.flight_number || current.flightNumber,
              flightDate: details.flight_date || current.flightDate,
            }));
            setStepIndex(0);
            setNotice("Ticket details filled in. Check each answer as you continue.");
          }} />} />

          <div className="request-chat-controls">
            <button type="button" className="chat-back" disabled={stepIndex === 0 || disabled} onClick={() => { setError(""); setNotice(""); setStepIndex((current) => Math.max(0, current - 1)); }}>← Back</button>
            <div className="chat-continue-actions">
                <button className="chat-send" disabled={disabled || searching || (question.key === "destinationName" && (!draft.latitude || !draft.longitude))}>
                  Continue <span aria-hidden="true">→</span>
                </button>
            </div>
          </div>
          {error && <p className="chat-error" role="alert">{error}</p>}
          {notice && <p className="chat-notice" role="status">{notice}</p>}
        </form>
      ) : (
        <div className="request-chat-review">
          <p className="chat-notice" id="chat-preview-notice">Preview only. Saving ride requests is not enabled in this flow.</p>
          <dl>{questions.map((item) => (
            <div key={item.key}><dt>{item.prompt}</dt><dd>{answerFor(item.key)}</dd><button type="button" disabled={disabled} onClick={() => setStepIndex(questions.findIndex((candidate) => candidate.key === item.key))}>Change</button></div>
          ))}</dl>
          <div className="request-chat-controls">
            <button type="button" className="chat-back" disabled={disabled} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>← Back</button>
            <button type="button" className="chat-send" disabled aria-describedby="chat-preview-notice">Save request</button>
          </div>
          {error && <p className="chat-error" role="alert">{error}</p>}
          {notice && <p className="chat-notice" role="status">{notice}</p>}
        </div>
      )}


    </section>
  );
}
