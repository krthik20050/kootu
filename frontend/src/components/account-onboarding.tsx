"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthControls } from "./auth-controls";
import { apiRequest } from "@/lib/api/client";
import { signInHref } from "@/lib/auth-navigation";
import { roleHome, type AccountRole } from "@/lib/roles";

export function AccountOnboarding() {
  return process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ? <AccountIdentity /> : <main className="workspace"><h1>Account setup is unavailable</h1><p>Sign-in needs to be configured.</p></main>;
}

function AccountIdentity() {
  const { userId } = useAuth();
  return <AccountSession key={userId || "signed-out"} />;
}

function AccountSession() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const preferred = params.get("role");
  const [ready, setReady] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(false);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Sign in again to continue.");
        const me = await apiRequest<{ role: AccountRole }>("/me", token);
        if (!active) return;
        if (me.role !== "UNASSIGNED") router.replace(roleHome(me.role));
        else setReady(userId || null);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Unable to load your account."); }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId, getToken, router, attempt]);

  async function choose(role: "PASSENGER" | "DRIVER") {
    if (saving.current) return;
    saving.current = true;
    setBusy(true); setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in again to continue.");
      const me = await apiRequest<{ role: AccountRole }>("/me/role", token, { method: "POST", body: { role } });
      if (mounted.current) router.replace(roleHome(me.role));
    } catch (caught) { if (mounted.current) { setError(caught instanceof Error ? caught.message : "Unable to save your account type."); setBusy(false); } }
    finally { saving.current = false; }
  }
  const target = preferred === "PASSENGER" || preferred === "DRIVER" ? `/onboarding?role=${preferred}` : "/onboarding";
  return <><header className="site-header"><Link href="/" className="wordmark">kootu<span className="brand-dot" /></Link><AuthControls /></header><main className="workspace account-setup">
    <p className="eyebrow">YOUR KOOTU ACCOUNT</p><h1>How will you travel?</h1>
    <p>Passenger and driver accounts have separate workspaces. Your choice is saved to your account and used every time you sign in.</p>
    {error && <div role="alert"><p>{error}</p>{ready !== userId && <button className="action" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button>}</div>}
    {!isLoaded ? <p role="status">Loading your session…</p> : !isSignedIn ? <><p>{preferred === "DRIVER" ? "Register to manage your vehicle and ride offers." : "Register to plan your arrival and find a shared ride."}</p><Link className="action" href={`/sign-up?next=${encodeURIComponent(target)}`}>Create your {preferred === "DRIVER" ? "driver" : preferred === "PASSENGER" ? "passenger" : "kootu"} account</Link><p>Already registered? <Link href={signInHref(target)}>Sign in</Link></p></> : ready !== userId ? !error && <p role="status">Opening your account…</p> : <>
      {preferred !== "DRIVER" && <section className="setup-state"><h2>Ride as a passenger</h2><p>Add a flight, confirm your destination and travel needs, and follow your shared ride.</p><button className="action" disabled={busy} onClick={() => void choose("PASSENGER")}>{busy ? "Saving…" : "Register as a passenger"}</button></section>}
      {preferred !== "PASSENGER" && <section className="setup-state"><h2>Drive with kootu</h2><p>Register your vehicle, get operator approval, and manage ride offers and trips.</p><button className="action" disabled={busy} onClick={() => void choose("DRIVER")}>{busy ? "Saving…" : "Register as a driver"}</button></section>}
      {(preferred === "DRIVER" || preferred === "PASSENGER") && !busy && <p><Link href="/onboarding">Choose a different account type</Link></p>}
      <p className="quiet">Choose carefully. This MVP keeps one account type per sign-in; you cannot switch roles from a workspace.</p>
    </>}
  </main></>;
}
