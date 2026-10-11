import type { ReactNode } from "react";
import type { ExtractedFlight } from "@/lib/api/generated";

/** Keep printed airport-local times intact rather than shifting boarding time to the browser zone. */
export function printedTime(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}).*(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · ${match[2]} (UTC${match[3] === "Z" ? "+00:00" : match[3]})`;
}

export function TicketReview({ details, airport, number, children }: {
  details: ExtractedFlight; airport: string; number: string; children: ReactNode;
}) {
  const fields = [
    ["Boarding", printedTime(details.boarding_at)], ["Seat", details.seat], ["Gate", details.gate],
    ["Departure", printedTime(details.departure_at)], ["Arrival", printedTime(details.arrival_at)],
    ["Departure terminal", details.departure_terminal], ["Arrival terminal", details.arrival_terminal],
    ["Cabin", details.cabin], ["Baggage allowance", details.baggage_allowance],
    ["Booking reference", details.booking_reference], ["Ticket number", details.ticket_number],
  ].filter(([, value]) => value);
  return <section className="ticket-review" aria-label="Your ticket details">
    <header className="ticket-review-header">
      <div><p className="eyebrow">YOUR FLIGHT TICKET</p><p>{details.airline || "Flight details"}</p></div>
      <span className="ticket-flight-number">{number || "Add flight number"}</span>
    </header>
    <div className="ticket-route" aria-label="Flight route">
      <div><small>FROM</small><strong>{details.departure_airport || "—"}</strong></div>
      <span aria-hidden="true">✈</span>
      <div><small>ARRIVING AT</small><strong>{airport || "—"}</strong></div>
    </div>
    <div className="ticket-editable">{children}</div>
    {fields.length > 0 && <div className="ticket-printed">
      <p className="eyebrow">AS PRINTED ON YOUR TICKET</p>
      <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p className="quiet">Times include the airport’s UTC offset. Check your airline for gate or schedule changes.</p>
    </div>}
  </section>;
}
