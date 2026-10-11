import type { ExtractedFlight } from "@/lib/api/generated";

/** Suggest pickup after baggage collection, preserving the printed arrival offset. */
export function readyFromArrival(arrival?: string | null): string {
  if (!arrival || !/(Z|[+-]\d{2}:\d{2})$/.test(arrival)) return "";
  const time = new Date(arrival).getTime();
  if (!Number.isFinite(time)) return "";
  return new Date(time + 30 * 60 * 1000).toISOString();
}

/** Explicit airport-local time, never interpreted in the browser's timezone. */
export function arrivalFromPrintedTime(local: string, offset: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ||
      !/^[+-](?:0\d|1[0-3]):[0-5]\d$|^\+14:00$/.test(offset)) return "";
  const [year, month, day, hour, minute] = local.split(/[-T:]/).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day || hour > 23 || minute > 59) return "";
  return `${local}:00${offset}`;
}

// These Indian arrival airports use IST year-round. Unknown airports require confirmation.
export function knownArrivalOffset(airport: string): string {
  return new Set(["COK", "TRV", "CCJ", "CNN", "DEL", "BOM", "BLR", "MAA", "HYD", "CCU", "GOI", "GOX", "PNQ", "AMD", "IXE", "CJB", "TRZ", "IXM", "IXB", "GAU", "LKO", "JAI", "ATQ", "IXC", "SXR", "BBI", "VNS", "PAT", "NAG", "IDR", "RPR", "VTZ", "VGA", "IXZ", "IXR", "STV", "DED", "UDR", "BHO", "IMF", "DIB"]).has(airport) ? "+05:30" : "";
}

export function updateDraftFlight(current: PassengerDraft, flight: PassengerDraft["flight"]): PassengerDraft {
  const normalized = { ...flight, number: flight.number.trim().toUpperCase().replaceAll(" ", ""), airport: flight.airport.trim().toUpperCase() };
  const changed = normalized.number !== current.flight.number || normalized.airport !== current.flight.airport || normalized.date !== current.flight.date;
  return { ...current, flight: normalized, readyAt: changed ? "" : current.readyAt };
}


export type PassengerDraft = {
  displayName: string | null;
  passengerCount: string;
  luggageCount: string;
  readyAt: string;
  ticket: ExtractedFlight;
  flight: { airport: string; number: string; date: string };
  destination: string;
  coordinates: { latitude: string; longitude: string };
};

export function emptyPassengerDraft(): PassengerDraft {
  return {
    displayName: null, passengerCount: "1", luggageCount: "1", readyAt: "", ticket: {},
    flight: { airport: "COK", number: "", date: "" },
    destination: "", coordinates: { latitude: "", longitude: "" },
  };
}

/** One upload replaces every ticket-derived field, including fields on later steps. */
export function draftFromTicket(details: ExtractedFlight, fallbackName: string): PassengerDraft {
  return {
    displayName: details.display_name || fallbackName,
    passengerCount: details.passengers == null ? "" : String(details.passengers),
    luggageCount: details.luggage == null ? "" : String(details.luggage),
    readyAt: readyFromArrival(details.arrival_at),
    ticket: details,
    flight: {
      airport: details.arrival_airport || "",
      number: details.flight_number || "",
      date: details.flight_date || "",
    },
    destination: details.destination_name || "",
    coordinates: { latitude: "", longitude: "" },
  };
}
