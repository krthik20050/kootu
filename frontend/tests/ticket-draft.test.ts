import { describe, expect, it } from "vitest";
import { arrivalFromPrintedTime, draftFromTicket, readyFromArrival, updateDraftFlight } from "@/lib/ticket-draft";

describe("arrival readiness suggestion", () => {
  it("adds the baggage buffer across midnight in the browser timezone", () => {
    const arrival = "2026-10-11T23:40:00+05:30";
    const expected = new Date(Date.parse(arrival) + 30 * 60000);
    const value = readyFromArrival(arrival);
    expect(new Date(value).getTime()).toBe(expected.getTime());
  });
  it("leaves missing or invalid arrival times blank", () => {
    expect(readyFromArrival(null)).toBe("");
    expect(readyFromArrival("invalid")).toBe("");
    expect(readyFromArrival("2026-10-11T10:00:00")).toBe("");
  });
});

it("preserves arrival for unchanged flights and invalidates actual edits", () => {
  const draft = draftFromTicket({ flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", arrival_at: "2026-10-11T23:45:00+05:30" }, "Alice");
  expect(updateDraftFlight(draft, { ...draft.flight, number: "ai 123" }).readyAt).toBe(draft.readyAt);
  expect(updateDraftFlight(draft, { ...draft.flight, date: "2026-10-12" }).readyAt).toBe("");
});

it("uses an explicit arrival offset and rejects impossible printed dates", () => {
  expect(readyFromArrival(arrivalFromPrintedTime("2026-10-12T00:15", "+05:30"))).toBe("2026-10-11T19:15:00.000Z");
  expect(arrivalFromPrintedTime("2026-02-30T10:00", "+05:30")).toBe("");
  expect(arrivalFromPrintedTime("2026-10-12T00:15", "")).toBe("");
  expect(arrivalFromPrintedTime("2026-10-12T00:15", "+25:30")).toBe("");
});


it("builds the complete cross-step draft in one replacement and clears unknowns", () => {
  const full = draftFromTicket({ display_name: "Demo Traveller", passengers: 2, luggage: 0,
    arrival_airport: "COK", flight_number: "AI123", flight_date: "2026-10-11",
    arrival_at: "2026-10-11T10:00:00+05:30", destination_name: "Aluva station" }, "Account name");
  expect(full).toMatchObject({ displayName: "Demo Traveller", passengerCount: "2", luggageCount: "0",
    flight: { airport: "COK", number: "AI123", date: "2026-10-11" }, destination: "Aluva station" });
  expect(full.readyAt).toBe(readyFromArrival("2026-10-11T10:00:00+05:30"));
  const replacement = draftFromTicket({}, "Account name");
  expect(replacement).toMatchObject({ displayName: "Account name", passengerCount: "", luggageCount: "",
    readyAt: "", flight: { airport: "", number: "", date: "" }, destination: "",
    coordinates: { latitude: "", longitude: "" } });
});
