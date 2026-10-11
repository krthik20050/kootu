import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassengerDashboard } from "@/components/workspace/passenger-dashboard";

const state = vi.hoisted(() => ({ request: vi.fn(), getToken: vi.fn(async () => "session") }));
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: "passenger", getToken: state.getToken }),
  useUser: () => ({ user: { firstName: "Traveller" } }),
}));
vi.mock("@/components/workspace/request-frame", () => ({ RequestFrame: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/api/client", () => ({ apiRequest: (...args: unknown[]) => state.request(...args) }));

beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_AUTH_ENABLED", "true"); state.request.mockReset(); });

describe("passenger overview", () => {
  it("gives a new passenger real booking links without empty driver or group panels", async () => {
    state.request.mockImplementation(async (path) => path === "/me" ? { display_name: "Traveller" } : []);
    render(<PassengerDashboard />);
    const booking = await screen.findByRole("link", { name: "Plan a ride" });
    expect(booking.getAttribute("href")).toBe("/request");
    expect(screen.getByRole("link", { name: "Start with your ticket" }).getAttribute("href")).toBe("/passenger");
    expect(screen.getByText("Not scheduled")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Driver & pickup" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Your group" })).toBeNull();
  });

  it("keeps matching and confirmed cancellation working without inventing a pickup time", async () => {
    let status = "WAITING";
    state.request.mockImplementation(async (path) => {
      if (path === "/me") return { display_name: "Traveller" };
      if (path === "/ride-requests") return [{ id: "ride-1", status, airport: "COK", destination_name: "Aluva station", flight_number: "AI123", flight_date: "2026-10-11", flight_status: "SCHEDULED", ready_at: "2026-10-11T10:00:00Z", passengers: 1, luggage: 1, group_id: null }];
      if (path.endsWith("/match")) return { matched: false, message: "Waiting for a compatible group." };
      if (path.endsWith("/cancel")) { status = "CANCELLED"; return {}; }
      throw new Error(`Unexpected path ${path}`);
    });
    const user = userEvent.setup();
    render(<PassengerDashboard />);
    await user.click(await screen.findByRole("button", { name: "Find a group" }));
    await screen.findByText("Waiting for a compatible group.");
    expect(screen.getByText("Not scheduled")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Edit preview" }).getAttribute("href")).toBe("/request?edit=ride-1");
    await user.click(screen.getByRole("button", { name: "Cancel request" }));
    expect(state.request.mock.calls.some(([path]) => path.endsWith("/cancel"))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Your airport ride" })).toBeNull());
    expect(screen.getByRole("cell", { name: "cancelled" })).toBeTruthy();
    expect(state.request).toHaveBeenCalledWith("/ride-requests/ride-1/cancel", "session", { method: "POST" });
  });

  it("shows a service failure rather than a fabricated empty account", async () => {
    state.request.mockRejectedValue(new Error("Service unavailable"));
    render(<PassengerDashboard />);
    await screen.findByRole("alert");
    expect(screen.queryByRole("link", { name: "Plan a ride" })).toBeNull();
    expect(screen.getByRole("button", { name: "Refresh journeys" })).toBeTruthy();
  });
});
