import { Blob as NodeBlob } from "node:buffer";
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
    render(<VoicePreferences api={api} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Dictate special instructions" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Microphone access was denied");
    expect(api).not.toHaveBeenCalled();
  });

  it("releases a microphone granted after the component unmounts", async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    let grant!: (input: MediaStream) => void;
    microphone(() => new Promise((resolve) => { grant = resolve; }));
    const component = render(<VoicePreferences api={api} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Dictate special instructions" }));
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
    const component = render(<VoicePreferences api={api} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Dictate special instructions" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Stop dictation/ })).toBeTruthy());
    component.unmount();
    expect(recordingStop).toHaveBeenCalledOnce();
    expect(trackStop).toHaveBeenCalledOnce();
  });
});


it("automatically appends longer dictation and retries without recording again", async () => {
  const user = userEvent.setup();
  const stopTrack = vi.fn();
  microphone(async () => ({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream));
  vi.stubGlobal("Blob", NodeBlob);
  const close = vi.fn(async () => {});
  vi.stubGlobal("AudioContext", class {
    close = close;
    async decodeAudioData() {
      return { duration: 61, length: 61 * 16000, sampleRate: 16000, numberOfChannels: 1, getChannelData: () => new Float32Array(61 * 16000) };
    }
  });
  vi.stubGlobal("MediaRecorder", class {
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable?: (event: { data: Blob }) => void;
    onstop?: () => void;
    static isTypeSupported() { return true; }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["recorded audio"]) });
      this.onstop?.();
    }
  });
  const transcribe = vi.fn().mockRejectedValueOnce(new Error("Temporarily unavailable"))
    .mockResolvedValueOnce({ transcript: "Please help with my bags" });
  const onChange = vi.fn();
  render(<VoicePreferences api={transcribe as Api} value="Use the side entrance" onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: "Dictate special instructions" }));
  await user.click(await screen.findByRole("button", { name: "Stop dictation" }));
  await screen.findByText(/Temporarily unavailable/);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith("Use the side entrance\nPlease help with my bags"));
  expect(transcribe).toHaveBeenCalledTimes(2);
  const body = transcribe.mock.calls[0][1].body as FormData;
  expect(body.has("consent")).toBe(false);
  expect((body.get("file") as File).size).toBeGreaterThan(30 * 16000 * 2);
  expect(close).toHaveBeenCalledOnce();
  expect(stopTrack).toHaveBeenCalled();
});
