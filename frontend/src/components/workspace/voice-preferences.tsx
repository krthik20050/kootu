"use client";

import { useEffect, useRef, useState } from "react";
import type { TranscriptResponse } from "@/lib/api/generated";
import { encodeWav } from "@/lib/audio";
import { message, type Api } from "./shared";

export function VoicePreferences({ api, onNote }: { api: Api; onNote: (note: string) => void }) {
  const [consent, setConsent] = useState(false);
  const [language, setLanguage] = useState("unknown");
  const [state, setState] = useState<"idle" | "permission" | "recording" | "working">("idle");
  const [seconds, setSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const live = useRef(true);
  const operation = useRef(false);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (player.current) player.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }

  async function prepareRecording(chunks: Blob[], mime: string) {
    try {
      if (!chunks.length) throw new Error("No audio recorded. Try again.");
      const context = new AudioContext();
      try {
        const bytes = await new Blob(chunks, { type: mime }).arrayBuffer();
        const audio = await context.decodeAudioData(bytes);
        const wav = new File([encodeWav(audio)], "preferences.wav", { type: "audio/wav" });
        if (live.current) setFile(wav);
      } finally {
        await context.close();
      }
    } catch (error) {
      if (live.current) setError(`${message(error)} You can upload a WAV note or type instead.`);
    } finally {
      operation.current = false;
      if (live.current) setState("idle");
    }
  }

  async function start() {
    if (operation.current) return;
    operation.current = true;
    setError(""); setNotice(""); setTranscript(""); setFile(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined" || typeof AudioContext === "undefined")
        throw new Error("Microphone recording is unavailable here. Use HTTPS or localhost, upload a WAV note, or type your preferences.");
      setState("permission");
      const input = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      if (!live.current) { input.getTracks().forEach((track) => track.stop()); return; }
      stream.current = input;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const recording = new MediaRecorder(input, mime ? { mimeType: mime } : undefined);
      recorder.current = recording;
      const chunks: Blob[] = [];
      recording.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => {
        recording.onstop = null;
        stop(); operation.current = false;
        if (live.current) { setState("idle"); setError("Recording failed. Try again or type your preferences."); }
      };
      recording.onstop = () => {
        stop();
        if (!live.current) return;
        setState("working");
        void prepareRecording(chunks, recording.mimeType);
      };
      recording.start(1000);
      setState("recording"); setSeconds(0);
      const began = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - began) / 1000);
        setSeconds(elapsed);
        if (elapsed >= 29) stop();
      }, 250);
    } catch (error) {
      stop(); operation.current = false;
      if (live.current) {
        setState("idle");
        setError(error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in browser settings, upload a WAV note, or type your preferences."
          : message(error));
      }
    }
  }

  async function transcribe() {
    if (operation.current || !file || !consent) return;
    if (!file.size || file.size > 5 * 1024 * 1024) { setError("Choose a WAV note of up to 5 MB and 30 seconds."); return; }
    operation.current = true;
    setState("working"); setError(""); setNotice(""); setTranscript("");
    try {
      const body = new FormData();
      body.set("file", file); body.set("consent", "true"); body.set("language", language);
      const result = await api<TranscriptResponse>("/audio/transcribe", { method: "POST", body, timeout: 45000 });
      if (live.current) setTranscript(result.transcript);
    } catch (error) {
      if (live.current) setError(message(error));
    } finally {
      operation.current = false;
      if (live.current) setState("idle");
    }
  }
  const busy = state !== "idle";
  return (
    <div className="voice-assist" aria-labelledby="voice-title">
      <h3 id="voice-title">Prefer to say it?</h3>
      <p>Tell us about pickup help, luggage or comfort preferences in your own words.</p>
      <label>Spoken language<select value={language} disabled={busy} onChange={(event) => setLanguage(event.target.value)}>
        <option value="unknown">Detect automatically</option><option value="ml-IN">Malayalam</option><option value="en-IN">English</option><option value="hi-IN">Hindi</option><option value="ta-IN">Tamil</option><option value="kn-IN">Kannada</option>
      </select></label>
      <div className="voice-actions">
        {state === "recording" ? <button type="button" className="action" onClick={stop}>Stop recording · {seconds}s</button>
          : <button type="button" className="secondary" disabled={busy} onClick={() => void start()}>{state === "permission" ? "Waiting for microphone access…" : "Record preferences"}</button>}
        <label className="quiet">Or upload a WAV voice note<input aria-label="Voice note" type="file" accept="audio/wav,.wav" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setTranscript(""); setNotice(""); setError(""); }} /></label>
      </div>
      <p className="quiet">Up to 30 seconds. Recording stops automatically at 29 seconds.</p>
      {file && <audio ref={player} controls aria-label="Listen to your recording" />}
      <label className="check"><input type="checkbox" checked={consent} disabled={busy} onChange={(event) => setConsent(event.target.checked)} />I agree to send this recording to Sarvam for transcription.</label>
      <button type="button" className="secondary" disabled={busy || !file || !consent} onClick={() => void transcribe()}>Transcribe note</button>
      {state === "working" && <p role="status">Preparing or transcribing your voice note…</p>}
      {state === "recording" && <p role="status">Recording · {seconds} / 29 seconds</p>}
      {transcript && <div className="transcript">
        <label>Review your words<textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={4} /></label>
        <p className="quiet">{transcript.length} / 500 characters. Select seat and accessibility needs in the form above; these notes do not change matching.</p>
        <button type="button" className="secondary" disabled={busy || !transcript.trim() || transcript.length > 500} onClick={() => { onNote(transcript.trim()); setNotice("Your reviewed words have been added to the driver notes. You can edit them below."); }}>Use these notes</button>
      </div>}
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <p className="quiet">kootu does not save your recording. Sarvam’s retention terms apply.</p>
    </div>
  );
}
