import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Passenger } from "@/components/workspace/passenger";
import { DriverDesk } from "@/components/workspace/driver";
import { AdminDesk } from "@/components/workspace/admin";
import { UploadAssist } from "@/components/workspace/upload-assist";
import type { Api } from "@/components/workspace/shared";

const profile = {
  id: "person",
  role: "PASSENGER",
  display_name: "Alice",
  women_only_eligible: false,
};
const driver = {
  id: "driver",
  verification_status: "APPROVED",
  available: true,
  women_only_eligible: true,
};

describe("guided ride screens", () => {
  it("does not overlap background account reads while a refresh is pending", async () => {
    vi.useFakeTimers();
    try {
      let resolve!: (value: unknown) => void;
      const api = vi.fn(async (path) => {
        if (path === "/me") return new Promise((done) => { resolve = done; });
        if (path === "/ride-requests") return [];
        throw new Error(`Unexpected ${path}`);
      }) as Api;
      render(<Passenger api={api} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(45000); });
      expect((api as ReturnType<typeof vi.fn>).mock.calls.filter(([path]) => path === "/me")).toHaveLength(1);
      await act(async () => resolve(profile));
      expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears an account-load error after retry and enables upload", async () => {
    const user = userEvent.setup();
    let fail = true;
    const api = vi.fn(async (path) => {
      if (path === "/me") {
        if (fail) throw new Error("Could not reach kootu");
        return profile;
      }
      if (path === "/ride-requests") return [];
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await screen.findByRole("alert");
    expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(true);
    fail = false;
    await user.click(screen.getByRole("button", { name: "Retry connection" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false);
  });

  it("reviews flight details before saving and preserves the retry ID after failure", async () => {
    const user = userEvent.setup();
    const bodies: Record<string, unknown>[] = [];
    const api = vi.fn(async (path, options) => {
      if (path === "/me") return profile;
      if (path.startsWith("/flights/arrival?")) return { arrival_at: "2026-10-11T10:30:00+05:30" };
      if (path === "/ride-requests") {
        if (options?.method !== "POST") return [];
        bodies.push(options.body as Record<string, unknown>);
        if (bodies.length === 1) throw new Error("Please retry");
        return { id: "saved" };
      }
      if (path.endsWith("/match")) return { matched: false, group: null, message: "Your request remains waiting." };
      throw new Error(`Unexpected path ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Enter details instead" }) as HTMLButtonElement).disabled).toBe(false));
    await user.click(screen.getByRole("button", { name: "Enter details instead" }));
    fireEvent.change(screen.getByLabelText("Flight number"), { target: { value: "AI123" } });
    fireEvent.change(screen.getByLabelText("Flight date"), { target: { value: "2026-10-11" } });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await user.type(screen.getByLabelText("Exact drop-off address"), "Aluva station");
    await user.click(screen.getByText("Enter a map pin instead"));
    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "10.108" } });
    fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "76.351" } });
    await user.click(screen.getByText("Ride preferences & accessibility"));
    fireEvent.change(screen.getByLabelText("Child seats"), { target: { value: "1" } });
    await user.type(screen.getByLabelText(/Special instructions/), "Help with luggage");
    await user.click(screen.getByRole("button", { name: "Find my ride →" }));
    await screen.findByText("Please retry");
    expect(screen.queryByText("One step closer.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Find my ride →" }));
    await screen.findByText("One step closer.");
    expect(bodies).toHaveLength(2);
    expect(bodies[1].client_request_id).toBe(bodies[0].client_request_id);
    expect(bodies[1]).toMatchObject({ flight_number: "AI123", child_seats: 1, notes: "Help with luggage", flight_details_confirmed: true, destination: { latitude: 10.108, longitude: 76.351 } });
    expect(bodies[1].ready_at).toBe("2026-10-11T05:30:00.000Z");
  });

  it("fills ticket data immediately and clears stale suggestions on replacement", async () => {
    const user = userEvent.setup();
    let uploads = 0;
    const api = vi.fn(async (path, options) => {
      if (path === "/me") return profile;
      if (path === "/ride-requests") return [];
      if (path === "/tickets/extract") {
        expect((options?.body as FormData).has("consent")).toBe(false);
        uploads++;
        return { details: uploads === 1 ? { flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", departure_airport: "DEL", boarding_at: "2026-10-11T07:00:00+05:30", seat: "12A", gate: "B4", arrival_at: "2026-10-11T10:00:00+05:30", display_name: "Demo Traveller", passengers: 2, luggage: 3, destination_name: "Aluva station" } : {} };
      }
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false));
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File([new Uint8Array(6 * 1024 * 1024)], "first.pdf", { type: "application/pdf" }));
    await screen.findByText(/first.pdf/);
    expect(screen.getByText("12A")).toBeTruthy();
    expect(screen.getByText("B4")).toBeTruthy();
    expect(screen.getByText(/07:00 \(UTC\+05:30\)/)).toBeTruthy();
    expect(screen.queryByLabelText("Ready to leave")).toBeNull();
    await user.click(screen.getByLabelText("Flight number"));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Everything look right?" })).toBeTruthy();
    expect((screen.getByLabelText("Your name") as HTMLInputElement).value).toBe("Demo Traveller");
    expect((screen.getByLabelText("Luggage pieces") as HTMLInputElement).value).toBe("3");
    expect(screen.queryByLabelText(/Arrival time/)).toBeNull();
    expect(screen.getByText(/Pickup is planned 30 minutes after landing/)).toBeTruthy();
    expect((screen.getByLabelText("Arrival airport") as HTMLInputElement).value).toBe("COK");
    expect((screen.getByLabelText("Flight number") as HTMLInputElement).value).toBe("AI123");
    expect((screen.getByLabelText("Flight date") as HTMLInputElement).value).toBe("2026-10-11");
    expect((screen.getByLabelText("Passengers") as HTMLInputElement).value).toBe("2");
    // Browsers may emit input on the date field even when its value is unchanged.
    fireEvent.input(screen.getByLabelText("Flight date"), { target: { value: "2026-10-11" } });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByRole("heading", { name: "Where should we drop you?" })).toBeTruthy();
    expect((screen.getByLabelText("Exact drop-off address") as HTMLInputElement).value).toBe("Aluva station");
    await user.type(screen.getByLabelText(/Special instructions/), "Help with bags");
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByText(/Pickup is planned 30 minutes after landing/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect((screen.getByLabelText(/Special instructions/) as HTMLTextAreaElement).value).toBe("Help with bags");
    expect((screen.getByLabelText("Exact drop-off address") as HTMLInputElement).value).toBe("Aluva station");
    await user.click(screen.getByRole("button", { name: "← Back" }));
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "second.pdf", { type: "application/pdf" }));
    await screen.findByText(/second.pdf/);
    expect(screen.queryByText("12A")).toBeNull();
    expect((screen.getByLabelText("Flight number") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Passengers") as HTMLInputElement).value).toBe("");
    expect(screen.queryByLabelText(/Arrival time/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByRole("heading", { name: "Everything look right?" })).toBeTruthy();
  });

  it("offers a retry without applying data when extraction fails", async () => {
    const user = userEvent.setup();
    const onTicket = vi.fn();
    const api = vi.fn(async () => { throw new Error("Ticket provider unavailable"); }) as Api;
    render(<UploadAssist api={api} onTicket={onTicket} />);
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PNG"], "ticket.png", { type: "image/png" }));
    await screen.findByRole("alert");
    expect(onTicket).not.toHaveBeenCalled();
  });

  it("rechecks arrival after editing a flight and stays on review when lookup fails", async () => {
    const user = userEvent.setup();
    const lookups: string[] = [];
    let fail = true;
    const api = vi.fn(async (path) => {
      if (path === "/me") return profile;
      if (path === "/ride-requests") return [];
      if (path === "/tickets/extract") return { details: { flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", arrival_at: "2026-10-11T10:00:00+05:30", passengers: 1, luggage: 0 } };
      if (path.startsWith("/flights/arrival?")) {
        lookups.push(path);
        if (fail) throw new Error("Arrival time is unavailable");
        return { arrival_at: "2026-10-11T11:00:00+05:30" };
      }
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false));
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "flight.pdf", { type: "application/pdf" }));
    await screen.findByText(/flight.pdf/);
    fireEvent.change(screen.getByLabelText("Flight number"), { target: { value: "AI456" } });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByText("Arrival time is unavailable");
    expect(screen.getByRole("heading", { name: "Everything look right?" })).toBeTruthy();
    expect(lookups[0]).toContain("number=AI456");
    fail = false;
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByRole("heading", { name: "Where should we drop you?" });
    expect(lookups).toHaveLength(2);
  });

  it("recovers a missing provider arrival with confirmed itinerary timing and saves the buffered time", async () => {
    const user = userEvent.setup();
    const api = vi.fn(async (path, options) => {
      if (path === "/me") return profile;
      if (path === "/ride-requests") return options?.method === "POST" ? { id: "saved" } : [];
      if (path === "/tickets/extract") return { details: { flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", passengers: 1, luggage: 0 } };
      if (path.startsWith("/flights/arrival?")) throw new Error("Arrival time is unavailable");
      if (path.endsWith("/match")) return { matched: false, message: "Waiting for company." };
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false));
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "boarding.pdf", { type: "application/pdf" }));
    await screen.findByText(/boarding.pdf/);
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByText("Let’s confirm your landing.");
    expect(api).not.toHaveBeenCalledWith("/ride-requests", expect.objectContaining({ method: "POST" }));
    fireEvent.input(screen.getByLabelText("Landing date and time on your itinerary"), { target: { value: "2026-10-12T00:15" } });
    expect(screen.getByText("Time at COK, India (IST).")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByRole("heading", { name: "Where should we drop you?" });
    await user.type(screen.getByLabelText("Exact drop-off address"), "Aluva station");
    await user.click(screen.getByText("Enter a map pin instead"));
    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "10.108" } });
    fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "76.351" } });
    await user.click(screen.getByRole("button", { name: "Find my ride →" }));
    await screen.findByText("One step closer.");
    expect(api).toHaveBeenCalledWith("/ride-requests", expect.objectContaining({ body: expect.objectContaining({ ready_at: "2026-10-11T19:15:00.000Z" }) }));
  });

  it("clears a missing-flight warning when a replacement itinerary supplies its arrival", async () => {
    const user = userEvent.setup();
    let uploads = 0;
    const api = vi.fn(async (path) => {
      if (path === "/me") return profile;
      if (path === "/ride-requests") return [];
      if (path === "/tickets/extract") return { details: { flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", passengers: 1, luggage: 0, arrival_at: ++uploads === 2 ? "2026-10-11T08:06:00+05:30" : null } };
      if (path.startsWith("/flights/arrival?")) throw new Error("No arrival found");
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByLabelText("Upload Your Ticket") as HTMLInputElement).disabled).toBe(false));
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "boarding.pdf", { type: "application/pdf" }));
    await screen.findByText("boarding.pdf");
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByText("No arrival found");
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "itinerary.pdf", { type: "application/pdf" }));
    await screen.findByText("itinerary.pdf");
    expect(screen.queryByText("No arrival found")).toBeNull();
    expect(screen.queryByText("Let’s confirm your landing.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByRole("heading", { name: "Where should we drop you?" });
  });

  it("shows indeterminate extraction progress until the server actually succeeds", async () => {
    const user = userEvent.setup();
    let resolve!: (value: unknown) => void;
    const api = vi.fn(() => new Promise((done) => { resolve = done; })) as Api;
    const onTicket = vi.fn();
    render(<UploadAssist api={api} onTicket={onTicket} />);
    await user.upload(screen.getByLabelText("Upload Your Ticket"), new File(["PDF"], "ticket.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBeNull();
    expect(screen.queryByText("✓ Your ticket details are ready")).toBeNull();
    expect(onTicket).not.toHaveBeenCalled();
    await act(async () => resolve({ details: { seat: "12A" } }));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    expect(onTicket).toHaveBeenCalledWith({ seat: "12A" });
  });

  it("shows backend errors without inventing saved rides", async () => {
    const api = vi.fn(async () => { throw new Error("Database is not configured"); }) as Api;
    render(<Passenger api={api} />);
    expect((await screen.findByRole("alert")).textContent).toContain("Database is not configured");
    expect(screen.queryByText("One step closer.")).toBeNull();
  });
  it("accepts an actual driver offer and refreshes the trip", async () => {
    const user = userEvent.setup();
    let accepted = false;
    const api = vi.fn(async (path) => {
      if (path === "/drivers/me") return driver;
      if (path === "/vehicles") return [];
      if (path === "/driver-offers")
        return [
          {
            id: "offer",
            group_id: "group",
            status: accepted ? "ACCEPTED" : "PENDING",
            expires_at: "2099-01-01T00:00:00Z",
            departure_at: "2099-01-01T00:00:00Z",
            airport: "COK",
            destination_cluster: "Aluva",
            passengers: 2,
            luggage: 2,
            wheelchair_spaces: 0,
            child_seats: 0,
            pet_friendly: false,
          },
        ];
      if (path === "/driver-offers/offer/accept") {
        accepted = true;
        return { id: "group" };
      }
      if (path === "/ride-groups/group")
        return {
          id: "group",
          status: "ASSIGNED",
          departure_at: "2099-01-01T00:00:00Z",
        };
      throw new Error(`Unexpected path ${path}`);
    }) as Api;
    render(<DriverDesk api={api} />);
    await user.click(
      await screen.findByRole("button", { name: "Accept group" }),
    );
    await screen.findByRole("button", { name: "Start trip" });
    expect(api).toHaveBeenCalledWith("/driver-offers/offer/accept", {
      method: "POST",
    });
  });

  it("denies the operator screen to a passenger", async () => {
    const api = vi.fn(async () => profile) as Api;
    render(<AdminDesk api={api} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "for kootu operators",
    );
    expect(
      screen.queryByRole("button", { name: "Approve after review" }),
    ).toBeNull();
  });
});
