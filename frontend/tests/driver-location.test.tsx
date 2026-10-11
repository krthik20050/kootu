import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DriverLocationPin, DriverLocationShare } from "@/components/workspace/driver-location";
import type { Api } from "@/components/workspace/shared";

afterEach(() => vi.unstubAllGlobals());

describe("trip location sharing", () => {
  it("requests permission only after a tap, sends coordinates, and clears on stop", async () => {
    let success: PositionCallback | undefined;
    const capture = vi.fn((callback: PositionCallback) => { success = callback; });
    vi.stubGlobal("isSecureContext", true);
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: capture } });
    const api = vi.fn(async () => ({})) as Api;
    render(<DriverLocationShare api={api} groupId="trip" />);
    expect(capture).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Share my location" }));
    expect(capture).toHaveBeenCalledOnce();
    await act(async () => success?.({ coords: { latitude: 10.1, longitude: 76.3, accuracy: 12 }, timestamp: Date.now() } as GeolocationPosition));
    expect(api).toHaveBeenCalledWith("/ride-groups/trip/driver-location", expect.objectContaining({ method: "PUT", body: expect.objectContaining({ coordinates: { latitude: 10.1, longitude: 76.3 }, accuracy_metres: 12 }) }));
    fireEvent.click(screen.getByRole("button", { name: "Stop sharing" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/ride-groups/trip/driver-location", { method: "DELETE" }));
  });

  it("builds key-free Maps links and prevents navigation to stale positions", () => {
    const location = { coordinates: { latitude: 10.1, longitude: 76.3 }, accuracy_metres: 12, captured_at: new Date().toISOString(), updated_at: new Date().toISOString(), stale: false };
    const { rerender } = render(<DriverLocationPin location={location} />);
    const link = screen.getByRole("link", { name: /View driver in Google Maps/ }) as HTMLAnchorElement;
    const url = new URL(link.href);
    expect(url.searchParams.get("query")).toBe("10.1,76.3");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.has("key")).toBe(false);
    rerender(<DriverLocationPin location={{ ...location, stale: true }} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Driver location is out of date/)).toBeTruthy();
  });
});
