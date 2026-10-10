import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VoicePreferences } from "@/components/workspace/voice-preferences";
import type { Api } from "@/components/workspace/shared";

const api = vi.fn() as Api;

function microphone(getUserMedia: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  vi.stubGlobal("AudioContext", class {});
  vi.stubGlobal("MediaRecorder", class { static isTypeSupported() { return true; } });
}

describe("voice recording failures and cleanup", () => {
  it("explains denied permission and does not contact Sarvam", async () => {
    const user = userEvent.setup();
    microphone(async () => { throw new DOMException("Denied", "NotAllowedError"); });
    render(<VoicePreferences api={api} onNote={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Record preferences" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Microphone access was denied");
    expect(api).not.toHaveBeenCalled();
  });

  it("releases a microphone granted after the component unmounts", async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    let grant!: (input: MediaStream) => void;
    microphone(() => new Promise((resolve) => { grant = resolve; }));
    const component = render(<VoicePreferences api={api} onNote={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Record preferences" }));
    component.unmount();
    await act(async () => grant({ getTracks: () => [{ stop }] } as unknown as MediaStream));
    expect(stop).toHaveBeenCalledOnce();
  });

  it("stops the recorder and microphone tracks on unmount", async () => {
    const user = userEvent.setup();
    const trackStop = vi.fn();
    const recordingStop = vi.fn();
    microphone(async () => ({ getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream));
    vi.stubGlobal("MediaRecorder", class {
      state = "inactive";
      static isTypeSupported() { return true; }
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; recordingStop(); }
    });
    const component = render(<VoicePreferences api={api} onNote={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Record preferences" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Stop recording/ })).toBeTruthy());
    component.unmount();
    expect(recordingStop).toHaveBeenCalledOnce();
    expect(trackStop).toHaveBeenCalledOnce();
  });
});
