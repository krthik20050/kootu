import { describe, expect, it } from "vitest";
import { readyFromArrival } from "@/lib/ticket-draft";

describe("arrival readiness suggestion", () => {
  it("adds the baggage buffer across midnight in the browser timezone", () => {
    const arrival = "2026-10-11T23:40:00+05:30";
    const expected = new Date(Date.parse(arrival) + 45 * 60000);
    const value = readyFromArrival(arrival);
    expect(new Date(value).getTime()).toBe(expected.getTime());
  });
  it("leaves missing or invalid arrival times blank", () => {
    expect(readyFromArrival(null)).toBe("");
    expect(readyFromArrival("invalid")).toBe("");
  });
});
