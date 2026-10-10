import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Passenger } from "@/components/workspace/passenger";
import { DriverDesk } from "@/components/workspace/driver";
import { AdminDesk } from "@/components/workspace/admin";
import { UploadAssist } from "@/components/workspace/upload-assist";
import { VoicePreferences } from "@/components/workspace/voice-preferences";
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

describe("connected ride screens", () => {
  it("submits reviewed flight details, coordinates and explicit needs; preserves the retry ID", async () => {
    const user = userEvent.setup();
    const calls: Array<{ path: string; body?: object | FormData }> = [];
    const api = vi.fn(async (path, options) => {
      calls.push({ path, body: options?.body });
      if (path === "/me") return profile;
      if (path === "/ride-requests")
        return options?.method === "POST" ? { id: "saved" } : [];
      if (path.endsWith("/match"))
        return {
          matched: false,
          group: null,
          message: "Your request remains waiting.",
        };
      throw new Error(`Unexpected path ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText("Your name") as HTMLInputElement).disabled,
      ).toBe(false),
    );
    fireEvent.change(screen.getByLabelText("Flight number"), {
      target: { value: "AI123" },
    });
    fireEvent.change(screen.getByLabelText("Flight date"), {
      target: { value: "2026-10-11" },
    });
    fireEvent.change(screen.getByLabelText("Ready to leave"), {
      target: { value: "2026-10-11T10:30" },
    });
    await user.click(screen.getByLabelText(/checked the flight/));
    await user.type(
      screen.getByLabelText("Exact drop-off address"),
      "Aluva station",
    );
    await user.click(screen.getByText("Enter coordinates manually"));
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "10.108" },
    });
    fireEvent.change(screen.getByLabelText("Longitude"), {
      target: { value: "76.351" },
    });
    fireEvent.change(screen.getByLabelText("Child seats"), {
      target: { value: "1" },
    });
    await user.type(
      screen.getByLabelText("Anything else the driver should know?"),
      "Help with luggage",
    );
    await user.click(screen.getByRole("button", { name: /Save arrival/ }));
    await screen.findByText("Your request remains waiting.");
    const first = calls.find(
      (call) => call.path === "/ride-requests" && call.body,
    )?.body as Record<string, unknown>;
    expect(first).toMatchObject({
      flight_number: "AI123",
      child_seats: 1,
      notes: "Help with luggage",
      flight_details_confirmed: true,
      destination: { latitude: 10.108, longitude: 76.351 },
    });
    await user.click(screen.getByRole("button", { name: /Save arrival/ }));
    await waitFor(() =>
      expect(
        calls.filter((call) => call.path === "/ride-requests" && call.body),
      ).toHaveLength(2),
    );
    const second = calls.filter(
      (call) => call.path === "/ride-requests" && call.body,
    )[1].body as Record<string, unknown>;
    expect(second.client_request_id).toBe(first.client_request_id);
  });

  it("shows backend errors without inventing saved rides", async () => {
    const api = vi.fn(async () => {
      throw new Error("Database is not configured");
    }) as Api;
    render(<Passenger api={api} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Database is not configured",
    );
    expect(
      screen.queryByText("A group is ready for driver review."),
    ).toBeNull();
  });

  it("requires a reviewed transcript before it becomes notes", async () => {
    const user = userEvent.setup();
    const onNote = vi.fn();
    const api = vi.fn(async () => ({
      transcript: "One child seat",
      confirmation_required: true,
    })) as Api;
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:voice"), revokeObjectURL: vi.fn() });
    render(<VoicePreferences api={api} onNote={onNote} />);
    await user.upload(
      screen.getByLabelText("Voice note"),
      new File(["WAV"], "voice.wav", { type: "audio/wav" }),
    );
    await user.click(screen.getByLabelText(/send this recording to Sarvam/));
    const recording = screen.getByLabelText("Voice note") as HTMLInputElement;
    expect(recording.files?.length).toBe(1);
    expect(
      (
        screen.getByLabelText(
          /send this recording to Sarvam/,
        ) as HTMLInputElement
      ).checked,
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Transcribe note" }));
    await screen.findByLabelText("Review your words");
    expect(onNote).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Use these notes" }));
    expect(onNote).toHaveBeenCalledWith("One child seat");
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

  it("fills ticket suggestions and clears stale fields and review confirmation on a second upload", async () => {
    const user = userEvent.setup();
    let uploads = 0;
    const api = vi.fn(async (path) => {
      if (path === "/me") return profile;
      if (path === "/ride-requests") return [];
      if (path === "/tickets/extract") {
        uploads++;
        return { confirmation_required: true, details: uploads === 1
          ? { flight_number: "AI123", flight_date: "2026-10-11", arrival_airport: "COK", display_name: "Demo Traveller", passengers: 2 }
          : { flight_number: null, flight_date: null, arrival_airport: null, display_name: null, passengers: null } };
      }
      throw new Error(`Unexpected ${path}`);
    }) as Api;
    render(<Passenger api={api} />);
    await waitFor(() => expect((screen.getByLabelText("Your name") as HTMLInputElement).disabled).toBe(false));
    await user.upload(screen.getByLabelText("Ticket"), new File(["PDF"], "ticket.pdf", { type: "application/pdf" }));
    await user.click(screen.getByLabelText(/send this ticket to Groq/));
    fireEvent.submit(screen.getByRole("button", { name: /Fill from ticket/ }).closest("form")!);
    await waitFor(() => expect((screen.getByLabelText("Your name") as HTMLInputElement).value).toBe("Demo Traveller"));
    expect((screen.getByLabelText("Flight number") as HTMLInputElement).value).toBe("AI123");
    expect((screen.getByLabelText("Passengers") as HTMLInputElement).value).toBe("2");
    const confirmation = screen.getByLabelText(/checked the flight/) as HTMLInputElement;
    expect(confirmation.checked).toBe(false);
    await user.click(confirmation);
    fireEvent.change(screen.getByLabelText("Flight number"), { target: { value: "AI124" } });
    expect(confirmation.checked).toBe(false);
    await user.click(confirmation);
    fireEvent.submit(screen.getByRole("button", { name: /Fill from ticket/ }).closest("form")!);
    await screen.findByText(/Please enter the missing/);
    expect((screen.getByLabelText("Flight number") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Arrival airport") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Passengers") as HTMLInputElement).value).toBe("");
    expect(confirmation.checked).toBe(false);
  });

  it("preserves manually entered data when ticket extraction fails", async () => {
    const user = userEvent.setup();
    const onTicket = vi.fn();
    const api = vi.fn(async () => { throw new Error("Ticket provider unavailable"); }) as Api;
    render(<UploadAssist api={api} onTicket={onTicket} />);
    await user.upload(screen.getByLabelText("Ticket"), new File(["PNG"], "ticket.png", { type: "image/png" }));
    await user.click(screen.getByLabelText(/send this ticket to Groq/));
    fireEvent.submit(screen.getByRole("button", { name: /Fill from ticket/ }).closest("form")!);
    await screen.findByRole("alert");
    expect(onTicket).not.toHaveBeenCalled();
  });
