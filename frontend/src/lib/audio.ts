/** Encode decoded browser audio as mono 16 kHz PCM WAV for Sarvam. */
export function encodeWav(audio: AudioBuffer): ArrayBuffer {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0 || audio.duration > 30)
    throw new Error("Record a voice note between 1 and 30 seconds.");
  const rate = 16000;
  const length = Math.floor(audio.duration * rate);
  const output = new ArrayBuffer(44 + length * 2);
  const view = new DataView(output);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF"); view.setUint32(4, 36 + length * 2, true);
  write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, length * 2, true);
  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index));
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * audio.sampleRate / rate);
    const end = Math.min(audio.length, Math.max(start + 1, Math.floor((i + 1) * audio.sampleRate / rate)));
    let sample = 0;
    for (const channel of channels)
      for (let j = start; j < end; j++) sample += channel[j];
    sample = Math.max(-1, Math.min(1, sample / ((end - start) * channels.length)));
    view.setInt16(44 + i * 2, sample * (sample < 0 ? 32768 : 32767), true);
  }
  return output;
}
