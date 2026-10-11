import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DriverDesk } from "@/components/workspace/driver";
import type { Api } from "@/components/workspace/shared";

const driver = { id: "driver", verification_status: "APPROVED", available: false, women_only_eligible: false };
function service() {
  let available = false;
  let status = "ASSIGNED";
  const api = vi.fn(async (path, options) => {
    if (path === "/drivers/me") return { ...driver, available };
    if (path === "/drivers/me/availability") { available = (options?.body as { available: boolean }).available; return { ...driver, available }; }
    if (path === "/vehicles") return [];
    if (path === "/driver-offers") return [{ id: "offer", group_id: "group", status: "ACCEPTED", airport: "COK", destination_cluster: "Aluva", departure_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60000).toISOString(), passengers: 2, luggage: 2 }];
    if (path === "/ride-groups/group") return { id: "group", status, departure_at: new Date().toISOString(), events: [] };
    if (path === "/ride-groups/group/status") { status = (options?.body as { status: string }).status; return { id: "group", status }; }
    if (path === "/ride-groups/group/manifest") return [{ id: "party", display_name: "Test passenger", destination_name: "Aluva station", passengers: 1, luggage: 1, destination: { latitude: 10, longitude: 76 }, notes: "One small bag" }];
    throw new Error(`Unexpected ${path}`);
  }) as Api;
  return api;
}

describe("driver dashboard service integration", () => {
  it("persists availability through the actual endpoint before displaying success", async () => {
    const api = service();
    const user = userEvent.setup();
    render(<DriverDesk api={api} view="profile" />);
    await user.click(await screen.findByRole("button", { name: "Go available" }));
    await screen.findByText("You are available for new offers.");
    expect(api).toHaveBeenCalledWith("/drivers/me/availability", { method: "PATCH", body: { available: true } });
  });

  it("loads the manifest, starts and completes a trip, and moves it to history", async () => {
    const api = service();
    const user = userEvent.setup();
    const mounted = render(<DriverDesk api={api} view="trips" />);
    await user.click(await screen.findByRole("button", { name: "View drop-offs & notes" }));
    await screen.findByText("One small bag");
    await user.click(screen.getByRole("button", { name: "Start trip" }));
    await user.click(await screen.findByRole("button", { name: "Complete trip" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Complete trip" })).toBeNull());
    mounted.unmount();
    render(<DriverDesk api={api} view="history" />);
    await screen.findByText("completed");
    expect(api).toHaveBeenCalledWith("/ride-groups/group/status", { method: "POST", body: { status: "COMPLETED" } });
  });

  it("does not show onboarding or sample data when account loading fails", async () => {
    const api = vi.fn(async () => { throw new Error("Service unavailable"); }) as Api;
    render(<DriverDesk api={api} />);
    await screen.findByRole("alert");
    expect(screen.queryByText("Join as a driver")).toBeNull();
    expect(screen.getByRole("button", { name: "Retry connection" })).toBeTruthy();
  });

  it("does not overlap background reads while the previous request is pending", async () => {
    vi.useFakeTimers();
    try {
      const api = vi.fn(() => new Promise(() => {})) as Api;
      const mounted = render(<DriverDesk api={api} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(45000); });
      expect(api).toHaveBeenCalledTimes(1);
      mounted.unmount();
    } finally { vi.useRealTimers(); }
  });
});
