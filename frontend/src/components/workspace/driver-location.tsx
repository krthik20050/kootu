"use client";

import { useEffect, useRef, useState } from "react";
import type { DriverLocationResponse, GroupResponse } from "@/lib/api/generated";
import { ApiError } from "@/lib/api/client";
import { message, type Api } from "./shared";

export function DriverLocationShare({ api, groupId }: { api: Api; groupId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const clearing = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!sharing) return;
    let live = true;
    let busy = false;
    let pending: Promise<unknown> = Promise.resolve();
    function capture() {
      if (!live || busy || document.hidden) return;
      busy = true;
      navigator.geolocation.getCurrentPosition((position) => {
        if (!live) { busy = false; return; }
        pending = clearing.current.then(() => live ? api<GroupResponse>(`/ride-groups/${groupId}/driver-location`, {
          method: "PUT",
          body: {
            coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
            accuracy_metres: position.coords.accuracy,
            captured_at: new Date(position.timestamp).toISOString(),
          },
        }) : undefined).then(() => {
          if (live) { setUpdatedAt(new Date().toLocaleTimeString()); setError(""); }
        }).catch((failure) => {
          if (!live) return;
          setError(message(failure));
          if (failure instanceof ApiError && [401, 403, 404, 409].includes(failure.status)) setSharing(false);
        }).finally(() => { busy = false; });
      }, (failure) => {
        busy = false;
        if (!live) return;
        setError(failure.code === 1 ? "Location permission was denied. Allow it in your browser settings, then retry." : "Couldn’t get a recent location. Check GPS and retry.");
        if (failure.code === 1) setSharing(false);
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    }
    capture();
    const timer = setInterval(capture, 15000);
    document.addEventListener("visibilitychange", capture);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", capture);
      // Wait for a sent update before clearing it, so a late response cannot
      // restore the pin after Stop. Closing a browser can prevent this request.
      clearing.current = pending.then(() => api(`/ride-groups/${groupId}/driver-location`, { method: "DELETE" }))
        .catch(() => setError("Location updates stopped, but the saved pin could not be cleared. Retry Stop sharing; passengers will see it as stale."));
    };
  }, [sharing, api, groupId]);

  function start() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setError("Location sharing requires HTTPS and a browser with location support.");
      return;
    }
    setError("");
    setSharing(true);
  }
  async function stopSavedPin() {
    if (sharing) { setSharing(false); return; }
    try { await api(`/ride-groups/${groupId}/driver-location`, { method: "DELETE" }); setError(""); }
    catch (failure) { setError(message(failure)); }
  }

  return <div className="location-sharing">
    <p className="quiet">Share your position with passengers on this trip. Keep this page open; sharing pauses when you switch apps or lock your phone.</p>
    <div className="entry-actions">
      {!sharing && <button className="secondary" onClick={start}>Share my location</button>}
      <button className="text-button" onClick={() => void stopSavedPin()}>Stop sharing</button>
    </div>
    {sharing && <p role="status">{updatedAt ? `Location sent at ${updatedAt}` : "Getting your location…"}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}

export function DriverLocationPin({ location }: { location?: DriverLocationResponse | null }) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  if (!location) return <p className="quiet">The driver hasn’t shared a location yet.</p>;
  const age = Math.max(0, Math.floor((clock - Date.parse(location.captured_at)) / 1000));
  const stale = location.stale || age > 60;
  const pin = `${location.coordinates.latitude},${location.coordinates.longitude}`;
  const query = new URLSearchParams({ api: "1", query: pin });
  const directions = new URLSearchParams({ api: "1", destination: pin, travelmode: "driving" });
  return <div className="location-sharing">
    <p>{stale ? "Driver location is out of date" : "Driver’s shared location"} · updated {age < 60 ? `${age} seconds` : `${Math.floor(age / 60)} minutes`} ago</p>
    <p className="quiet">Reported accuracy: about {Math.ceil(location.accuracy_metres)} m. Google Maps opens this saved position.</p>
    {stale ? <p className="quiet">Wait for a fresh update before using this location.</p> : <div className="entry-actions">
      <a className="secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?${query}`}>View driver in Google Maps ↗</a>
      <a className="text-button" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?${directions}`}>Get directions ↗</a>
    </div>}
  </div>;
}
