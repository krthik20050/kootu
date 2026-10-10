import { describe, expect, it } from "vitest";
import { encodeWav } from "@/lib/audio";

function audio(seconds: number, values = [0, 1, -1, 0.5]): AudioBuffer {
  const samples = new Float32Array(Number.isFinite(seconds) ? Math.max(1, Math.floor(seconds * 16000)) : 1);
  samples.set(values.slice(0, samples.length));
  return { duration: seconds, sampleRate: 16000, length: samples.length, numberOfChannels: 1, getChannelData: () => samples } as unknown as AudioBuffer;
}

describe("Sarvam WAV conversion", () => {
  it("writes a valid mono 16 kHz PCM header and clipped signed samples", () => {
    const wav = encodeWav(audio(1, [0, 2, -2, 0.5]));
    const view = new DataView(wav);
    expect(String.fromCharCode(...new Uint8Array(wav, 0, 4))).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(40, true)).toBe(32000);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
  });
  it.each([0, 31, NaN])("rejects invalid or long decoded recordings (%s)", (duration) => {
    expect(() => encodeWav(audio(duration))).toThrow();
  });
  it("mixes stereo channels before encoding", () => {
    const buffer = audio(1);
    const stereo = { ...buffer, numberOfChannels: 2, getChannelData: (index: number) => new Float32Array(16000).fill(index ? -1 : 1) } as unknown as AudioBuffer;
    expect(new DataView(encodeWav(stereo)).getInt16(44, true)).toBe(0);
  });
});
