import type { ExtractedFlight } from "@/lib/api/generated";

/** Suggest pickup after baggage collection, preserving the printed arrival offset. */
export function readyFromArrival(arrival?: string | null): string {
  if (!arrival) return "";
  const time = new Date(arrival).getTime();
  if (!Number.isFinite(time)) return "";
  return new Date(time + 30 * 60 * 1000).toISOString();
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
