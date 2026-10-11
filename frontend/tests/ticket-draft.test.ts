import { describe, expect, it } from "vitest";
import { draftFromTicket, readyFromArrival } from "@/lib/ticket-draft";

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
  });
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
