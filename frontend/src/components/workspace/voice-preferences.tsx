"use client";

import { useEffect, useRef, useState } from "react";
import type { TranscriptResponse } from "@/lib/api/generated";
import { encodeWav } from "@/lib/audio";
import { message, type Api } from "./shared";

export function VoicePreferences({ api, value, onChange, onBusy }: {
  api: Api;
  value: string;
  onChange: (text: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [state, setState] = useState<"idle" | "permission" | "recording" | "working">("idle");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<File | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = useRef(true);
  const operation = useRef(false);
  const cancelled = useRef(false);
  const latest = useRef(value);

  useEffect(() => { latest.current = value; }, [value]);
  useEffect(() => { onBusy?.(state !== "idle"); }, [state, onBusy]);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stop(cancel = false) {
    cancelled.current = cancel;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }

  async function transcribe(file: File) {
    setRetry(file);
    const body = new FormData();
    body.set("file", file);
    const result = await api<TranscriptResponse>("/audio/transcribe", {
      method: "POST", body, timeout: 180000,
    });
    if (live.current) {
      const text = [latest.current.trim(), result.transcript.trim()].filter(Boolean).join("\n");
      onChange(text);
      setRetry(null);
    }
  }

  async function finish(chunks: Blob[], mime: string) {
    try {
      if (!chunks.length) throw new Error("No audio recorded. Try again.");
      const context = new AudioContext();
      let file: File;
      try {
        const bytes = await new Blob(chunks, { type: mime }).arrayBuffer();
        const audio = await context.decodeAudioData(bytes);
        file = new File([encodeWav(audio)], "instructions.wav", { type: "audio/wav" });
      } finally {
        await context.close();
      }
      if (live.current) await transcribe(file);
    } catch (error) {
      if (live.current) setError(message(error));
    } finally {
      operation.current = false;
      if (live.current) setState("idle");
    }
  }

  async function start() {
    if (operation.current) return;
    operation.current = true;
    cancelled.current = false;
    setError("");
    setRetry(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined" || typeof AudioContext === "undefined")
        throw new Error("Your browser can’t record here. You can type your instructions instead.");
      setState("permission");
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      if (!live.current) { input.getTracks().forEach((track) => track.stop()); return; }
      stream.current = input;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recording = new MediaRecorder(input, mime ? { mimeType: mime } : undefined);
      recorder.current = recording;
      const chunks: Blob[] = [];
      recording.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => {
        recording.onstop = null;
        stop(true);
        operation.current = false;
        if (live.current) { setState("idle"); setError("Recording failed. Try again or type your instructions."); }
      };
      recording.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        if (!live.current) return;
        if (cancelled.current) { operation.current = false; setState("idle"); return; }
        setState("working");
        void finish(chunks, recording.mimeType);
      };
      recording.start(1000);
      setState("recording");
      timer.current = setTimeout(() => stop(), 118000);
    } catch (error) {
      stop(true);
      operation.current = false;
      if (live.current) {
        setState("idle");
        setError(error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in browser settings, or type your instructions."
          : message(error));
      }
    }
  }

  async function retryTranscription() {
    if (!retry || operation.current) return;
    operation.current = true;
    setState("working");
    setError("");
    try { await transcribe(retry); }
    catch (error) { if (live.current) setError(message(error)); }
    finally { operation.current = false; if (live.current) setState("idle"); }
  }

  return (
    <div className="instructions">
      <label htmlFor="driver-instructions">Special instructions <span className="quiet">optional</span></label>
      <div className="comment-composer">
        <textarea id="driver-instructions" value={value} onChange={(event) => onChange(event.target.value)}
          rows={3} maxLength={2000} placeholder="Anything your driver should know?" />
        <button type="button" className={`mic-button ${state === "recording" ? "listening" : ""}`}
          aria-label={state === "recording" ? "Stop dictation" : "Dictate special instructions"}
          title={state === "recording" ? "Stop dictation" : "Dictate special instructions"}
          disabled={state === "permission" || state === "working"}
          onClick={() => state === "recording" ? stop() : void start()}>
          {state === "recording" ? <span aria-hidden="true">■</span> :
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" /></svg>}
        </button>
      </div>
      {state === "recording" && <div className="dictation-status"><p role="status">Listening… tap stop when you’re done.</p><button type="button" className="text-button" onClick={() => stop(true)}>Cancel</button></div>}
      {state === "permission" && <p className="quiet" role="status">Allow microphone access to start.</p>}
      {state === "working" && <p className="quiet" role="status">Turning your words into text…</p>}
      {value.length > 2000 && <p className="error" role="alert">Your words are preserved. Shorten the instructions to 2,000 characters before continuing.</p>}
      {error && <p className="error" role="alert">{error} {retry && <button type="button" className="text-button" disabled={state !== "idle"} onClick={() => void retryTranscription()}>Try again</button>}</p>}
    </div>
  );
}
