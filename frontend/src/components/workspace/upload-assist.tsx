"use client";

import { useRef, useState } from "react";
import type { ExtractedFlight, TicketResponse } from "@/lib/api/generated";
import { message, type Api } from "./shared";

export function UploadAssist({ api, onTicket, onBusy, disabled = false }: {
  api: Api;
  onTicket: (details: ExtractedFlight) => void;
  onBusy?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const operation = useRef(false);

  async function upload(file?: File) {
    if (operation.current || !file) return;
    setError("");
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError("Choose a PDF, JPG or PNG ticket under 5 MB.");
      return;
    }
    operation.current = true;
    setBusy(true);
    onBusy?.(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const result = await api<TicketResponse>("/tickets/extract", {
        method: "POST", body, timeout: 45000,
      });
      onTicket(result.details);
      setFilename(file.name);
    } catch (error) {
      setError(message(error));
    } finally {
      operation.current = false;
      setBusy(false);
      onBusy?.(false);
    }
  }

  return (
    <div className="ticket-upload">
      <label className={`upload-dropzone ${busy ? "is-reading" : ""}`}>
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M14 7h14l7 7v27H14V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M28 7v8h7M20 25h9M20 31h9" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>{busy ? "Reading your ticket…" : filename ? "Change ticket" : "Upload Your Ticket"}</span>
        <small>PDF or photo</small>
        <input className="upload-input" aria-label="Upload Your Ticket" type="file"
          accept="image/jpeg,image/png,application/pdf" disabled={busy || disabled}
          onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
      </label>
      {filename && !busy && <p className="ticket-file" role="status">✓ {filename}</p>}
      {error && <p className="error" role="alert">{error} You can enter the details instead.</p>}
    </div>
  );
}
