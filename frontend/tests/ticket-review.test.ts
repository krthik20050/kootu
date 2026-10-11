import { expect, it } from "vitest";
import { printedTime } from "@/components/workspace/ticket-review";

it("keeps printed boarding times and offsets instead of converting to the browser timezone", () => {
  expect(printedTime("2026-10-11T07:00:00+05:30")).toBe("11 Oct · 07:00 (UTC+05:30)");
  expect(printedTime("2026-10-11T23:40:00-04:00")).toBe("11 Oct · 23:40 (UTC-04:00)");
  expect(printedTime("2026-10-11T12:00:00Z")).toBe("11 Oct · 12:00 (UTC+00:00)");
  expect(printedTime(null)).toBeNull();
});
