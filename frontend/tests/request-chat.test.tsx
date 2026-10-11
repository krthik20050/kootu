import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestChat } from "@/components/workspace/request-chat";
import type { Api } from "@/components/workspace/shared";

const profile = { id: "person", role: "PASSENGER" as const, display_name: "Alice", women_only_eligible: false };
beforeEach(() => {
  window.HTMLElement.prototype.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});

function setup() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const bodies: Record<string, unknown>[] = [];
  let failures = 1;
  const api = vi.fn(async (path, options) => {
    if (path.startsWith("/flights/arrival?")) {
      expect(new URLSearchParams(path.split("?")[1]).get("number")).toBe("AI123");
      return { arrival_at: `${tomorrow}T10:00:00+05:30` };
    }
    if (path.startsWith("/locations/search")) return [{ place_id: "place", name: "Kochi centre", coordinates: { latitude: 10, longitude: 76 } }];
    if (path === "/me") return profile;
    if (path === "/ride-requests") {
      bodies.push(options.body);
      if (failures-- > 0) throw new Error("Temporary connection failure");
      return { ...options.body, id: "saved", status: "WAITING" };
    }
    if (path === "/tickets/extract") return { details: { flight_number: "AI123", flight_date: tomorrow, arrival_airport: "COK" } };
    throw new Error(`Unexpected ${path}`);
  }) as Api;
  render(<RequestChat api={api} profile={profile} accountName="Alice" disabled={false} />);
  return { api, tomorrow, bodies };
}

describe("integrated request chat", () => {
  it("uses current flight contracts, preserves voice input and retries with the same request ID", async () => {
    const user = userEvent.setup();
    const { api, tomorrow, bodies } = setup();
    await user.type(screen.getByLabelText("Flight number"), "AI123");
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText("Arrival date"), { target: { value: tomorrow } });
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await user.type(screen.getByRole("combobox"), "Kochi");
    await user.click(await screen.findByRole("option", { name: "Kochi centre" }));
    await user.click(screen.getByRole("button", { name: /Review details/ }));
    await screen.findByText(/Landing: 10:00/);
    expect(screen.getByRole("button", { name: "Dictate special instructions" })).toBeTruthy();
    await user.type(screen.getByLabelText(/Special instructions/), "Meet near arrivals");
    await user.click(screen.getByLabelText(/I confirm the flight number/));
    await user.click(screen.getByRole("button", { name: "Send ride request" }));
    await screen.findByText("Temporary connection failure");
    // A retry may finish refreshing the flight suggestion before confirmation.
    const confirmation = screen.getByLabelText(/I confirm the flight number/) as HTMLInputElement;
    if (!confirmation.checked) await user.click(confirmation);
    await user.click(screen.getByRole("button", { name: "Send ride request" }));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[0].client_request_id).toBe(bodies[1].client_request_id);
    expect(bodies[1]).toMatchObject({ notes: "Meet near arrivals", ready_at: `${tomorrow}T05:00:00.000Z`, flight_details_confirmed: true });
    expect(api).toHaveBeenCalledWith("/me", expect.objectContaining({ method: "PATCH", body: { display_name: "Alice", women_only_eligible: false } }));
  });

  it("uploads tickets through the existing extraction service", async () => {
    const user = userEvent.setup();
    const { api } = setup();
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["synthetic ticket"], "ticket.png", { type: "image/png" }));
    await waitFor(() => expect((screen.getByLabelText("Flight number") as HTMLInputElement).value).toBe("AI123"));
    expect(api).toHaveBeenCalledWith("/tickets/extract", expect.objectContaining({ method: "POST", body: expect.any(FormData) }));
  });
});
