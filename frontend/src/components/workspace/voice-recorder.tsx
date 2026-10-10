"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceRecorder({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "requesting" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  function releaseMicrophone() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const active = recorder.current;
      if (active) {
        active.ondataavailable = null;
        active.onstop = null;
        active.onerror = null;
        if (active.state !== "inactive") active.stop();
      }
      releaseMicrophone();
    };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is unavailable. Use a supported browser on HTTPS or localhost.");
      return;
    }
    setStatus("requesting");
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { microphone.getTracks().forEach(track => track.stop()); return; }
      stream.current = microphone;
      const active = new MediaRecorder(microphone);
      recorder.current = active;
      const chunks: BlobPart[] = [];
      active.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      active.onstop = () => {
        releaseMicrophone();
        if (!mounted.current) return;
        setStatus("idle");
        if (chunks.length) setPreview(URL.createObjectURL(new Blob(chunks, { type: active.mimeType })));
        else setError("No audio was captured. Please record again.");
      };
      active.onerror = () => {
        active.onstop = null;
        if (active.state !== "inactive") active.stop();
        releaseMicrophone();
        if (mounted.current) { setStatus("idle"); setError("Recording failed. Please try again."); }
      };
      active.start();
      setPreview("");
      setSeconds(0);
      setStatus("recording");
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(Math.min(elapsed, 30));
        if (elapsed >= 30) stop();
      }, 250);
    } catch (caught) {
      releaseMicrophone();
      if (!mounted.current) return;
      setStatus("idle");
      setError(caught instanceof DOMException && caught.name === "NotAllowedError"
        ? "Microphone access was denied. Allow it in your browser settings to record."
        : "Could not access your microphone. Check that it is connected and available.");
    }
  }

  return <div className="chat-voice-recorder">
    <div className="flex flex-wrap items-center gap-3">
      {status === "recording" ? <Button type="button" variant="outline" size="sm" onClick={stop}><Square className="mr-2 size-4" />Stop recording</Button>
        : <Button type="button" variant="outline" size="sm" disabled={disabled || status === "requesting"} onClick={() => void start()}><Mic className="mr-2 size-4" />{status === "requesting" ? "Allow microphone…" : preview ? "Record again" : "Record voice"}</Button>}
      <span role="status" className="text-xs text-muted-foreground">{status === "recording" ? `Recording · ${seconds}s / 30s` : "Up to 30 seconds"}</span>
    </div>
    {preview && <div className="mt-3 flex items-center gap-2"><audio controls src={preview} aria-label="Your voice recording" className="min-w-0 flex-1" /><Button type="button" variant="ghost" size="icon" aria-label="Discard recording" onClick={() => setPreview("")}><Trash2 className="size-4" /></Button></div>}
    {(preview || status === "recording") && <p className="mt-2 text-xs text-muted-foreground">Preview only. Audio stays in this browser and is not transcribed or sent.</p>}
    {error && <p role="alert" className="chat-error">{error}</p>}
  </div>;
}
