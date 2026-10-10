"use client";

import { useState } from "react";
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
  const [notice, setNotice] = useState("");
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    setError("");
    setNotice("");
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024) {
      setError("Choose a PDF, JPG or PNG ticket of up to 5 MB.");
      return;
    }
    if (!form.get("consent")) {
      setError("Agree to ticket processing before uploading.");
      return;
    }
    form.set("file", file);
    setBusy(true);
    onBusy?.(true);
    try {
      const result = await api<TicketResponse>("/tickets/extract", {
        method: "POST", body: form, timeout: 45000,
      });
      onTicket(result.details);
      const missing = [
        !result.details.flight_number && "flight number",
        !result.details.flight_date && "flight date",
        !result.details.arrival_airport && "arrival airport",
      ].filter(Boolean);
      setNotice(missing.length
        ? `Ticket read. Please enter the missing ${missing.join(", ")} and review all details below.`
        : "Your details are filled in. Review them below before saving your arrival.");
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <section className="assist ticket-assist" aria-labelledby="ticket-title">
      <p className="eyebrow">START WITH YOUR TICKET</p>
      <h2 id="ticket-title">Upload once. Check, then go.</h2>
      <p>We’ll fill the flight details, name and passenger count we can read. You can edit every suggestion.</p>
      <form onSubmit={(event) => void upload(event)}>
        <fieldset disabled={busy || disabled}>
          <label>Ticket<input name="file" type="file" accept="image/jpeg,image/png,application/pdf" required /></label>
          <p className="quiet">PDF (including scans), JPG or PNG · up to 5 MB · up to 3 PDF pages</p>
          <label className="check"><input type="checkbox" name="consent" value="true" required />I agree to send this ticket to Groq for extraction.</label>
          <button className="action">{busy ? "Reading your ticket…" : "Fill from ticket ↗"}</button>
        </fieldset>
      </form>
      {notice && <p role="status">{notice}</p>}
      {error && <p className="error" role="alert">{error} You can enter the details below.</p>}
      <p className="quiet">kootu does not save your upload. Groq’s retention terms apply. Your drop-off address and pickup readiness still need your input.</p>
    </section>
  );
}
