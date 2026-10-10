"use client";

import { useState } from "react";
import type {
  ExtractedFlight,
  TicketResponse,
  TranscriptResponse,
} from "@/lib/api/generated";
import { message, type Api } from "./shared";

export function UploadAssist({
  api,
  onTicket,
  onNote,
}: {
  api: Api;
  onTicket: (details: ExtractedFlight) => void;
  onNote: (note: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  async function upload(
    event: React.FormEvent<HTMLFormElement>,
    kind: "tickets" | "audio",
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input = event.currentTarget.elements.namedItem(
      "file",
    ) as HTMLInputElement;
    const file = input.files?.[0];
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a file of up to 5 MB.");
      setBusy(false);
      return;
    }
    form.set("file", file);
    try {
      if (kind === "tickets") {
        const result = await api<TicketResponse>("/tickets/extract", {
          method: "POST",
          body: form,
          timeout: 45000,
        });
        onTicket(result.details);
      } else {
        const result = await api<TranscriptResponse>("/audio/transcribe", {
          method: "POST",
          body: form,
          timeout: 45000,
        });
        setTranscript(result.transcript);
      }
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="assist">
      <summary>Have a ticket or a voice note?</summary>
      <div className="assist-grid">
        <form onSubmit={(event) => void upload(event, "tickets")}>
          <h3>Read your ticket</h3>
          <p>
            Autofill the arrival details, then check them below. JPG, PNG or a
            text PDF, up to 5 MB.
          </p>
          <label>
            Ticket
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              required
            />
          </label>
          <label className="check">
            <input type="checkbox" name="consent" value="true" required />I
            agree to send this ticket to Groq for extraction.
          </label>
          <button className="secondary" disabled={busy}>
            Read ticket
          </button>
        </form>
        <form onSubmit={(event) => void upload(event, "audio")}>
          <h3>Tell us what you need</h3>
          <p>
            Upload a WAV voice note under 30 seconds. Review the transcript
            before using it.
          </p>
          <label>
            Voice note
            <input name="file" type="file" accept="audio/wav,.wav" required />
          </label>
          <label className="check">
            <input type="checkbox" name="consent" value="true" required />I
            agree to send this recording to Sarvam for transcription.
          </label>
          <button className="secondary" disabled={busy}>
            Transcribe note
          </button>
        </form>
        {transcript && (
          <div className="transcript">
            <label>
              Review your words
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={4}
              />
            </label>
            <p>
              Keep notes within 500 characters. Select any seat or accessibility
              requirements in the form too.
            </p>
            <button
              className="secondary"
              type="button"
              disabled={transcript.length > 500}
              onClick={() => onNote(transcript)}
            >
              Use these notes
            </button>
          </div>
        )}
      </div>
      {busy && <p role="status">Reading your file…</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="quiet">
        Uploads are processed for this request and are not saved by kootu. Your
        provider’s own retention terms apply.
      </p>
    </details>
  );
}
