"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/components/ui/app-1-utils/dashboard-theme";
import type { ExtractedFlight, TicketResponse } from "@/lib/api/generated";
import { message, type Api } from "./shared";

export function TicketCamera({ api, disabled, onTicket }: {
  api: Api; disabled: boolean; onTicket: (details: ExtractedFlight) => void;
}) {
  const { theme } = useDashboardTheme();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const operation = useRef(0);

  function stopCamera() {
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }

  useEffect(() => {
    if (!open || file) return;
    let cancelled = false;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access needs a supported browser on HTTPS or localhost.");
        const camera = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (cancelled) { camera.getTracks().forEach(track => track.stop()); return; }
        stream.current = camera;
        if (video.current) video.current.srcObject = camera;
      } catch (caught) {
        if (!cancelled) setError(caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Camera access was denied. Allow access in browser settings, or choose a ticket file."
          : "Could not open the camera. Check your camera or choose a ticket file.");
      }
    }
    void startCamera();
    return () => { cancelled = true; stopCamera(); };
  }, [open, attempt, file]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { operation.current++; }, []);

  function changeOpen(value: boolean) {
    operation.current++;
    setOpen(value); setError(""); setBusy(false); setConsent(false);
    setReady(false); setFile(null); setPreview("");
    if (!value) stopCamera();
  }

  function selectFile(selected: File) {
    if (!selected.size || selected.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(selected.type)) {
      setError("Choose a JPG, PNG or text PDF of up to 5 MB."); return;
    }
    operation.current++;
    stopCamera(); setReady(false); setError(""); setConsent(false); setFile(selected);
    setPreview(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
  }

  function capture() {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.round(source.videoWidth * scale); canvas.height = Math.round(source.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) { setError("Could not capture a photo. Choose a ticket file instead."); return; }
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const current = operation.current;
    canvas.toBlob(blob => {
      if (current !== operation.current) return;
      if (blob) selectFile(new File([blob], "ticket.jpg", { type: "image/jpeg" }));
      else setError("Could not capture a photo. Please try again.");
    }, "image/jpeg", .88);
  }

  async function extract() {
    if (!file || !consent || busy) return;
    const current = ++operation.current;
    setBusy(true); setError("");
    const body = new FormData(); body.set("file", file); body.set("consent", "true");
    try {
      const result = await api<TicketResponse>("/tickets/extract", { method: "POST", body, timeout: 45000 });
      if (current !== operation.current) return;
      onTicket(result.details); changeOpen(false);
    } catch (caught) { if (current === operation.current) setError(message(caught)); }
    finally { if (current === operation.current) setBusy(false); }
  }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild><Button type="button" variant="outline" size="sm" disabled={disabled}><Camera className="mr-2 size-4" />Scan ticket</Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="ticket-camera-overlay" />
      <Dialog.Content data-theme={theme} className="app1-dashboard ticket-camera-dialog">
        <div className="flex items-center justify-between gap-3"><Dialog.Title className="text-lg font-semibold">Scan your ticket</Dialog.Title><Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="Close camera"><X className="size-4" /></Button></Dialog.Close></div>
        <Dialog.Description className="mt-1 text-sm text-muted-foreground">Fit your ticket inside the camera view. Check the photo before reading its details.</Dialog.Description>
        <div className="ticket-camera-view">
          {file ? preview ? <Image unoptimized src={preview} width={1600} height={1200} alt="Captured ticket to review before uploading" /> : <p className="p-6 text-sm">Selected: {file.name}</p>
            : <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)} aria-label="Live ticket camera" />}
        </div>
        {!file && !ready && !error && <p role="status" className="mt-2 text-xs text-muted-foreground">Waiting for camera access…</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {file ? <Button type="button" variant="outline" disabled={busy} onClick={() => { setFile(null); setPreview(""); setError(""); setReady(false); setConsent(false); setAttempt(value => value + 1); }}>Retake photo</Button>
            : <Button type="button" disabled={!ready} onClick={capture}><Camera className="mr-2 size-4" />Capture ticket</Button>}
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="mr-2 size-4" />Choose file</Button>
          <input ref={input} type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" aria-label="Choose ticket file" onChange={event => { const selected = event.target.files?.[0]; if (selected) selectFile(selected); event.target.value = ""; }} />
        </div>
        {file && <div className="mt-4 flex flex-col gap-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />I agree to send this ticket to Groq to extract flight details.</label><Button type="button" disabled={!consent || busy} onClick={() => void extract()}>{busy ? "Reading ticket…" : "Read ticket"}</Button></div>}
        {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
        {busy && <p role="status" className="mt-2 text-xs text-muted-foreground">Extracting your flight details…</p>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
