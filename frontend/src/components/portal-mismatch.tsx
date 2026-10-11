"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import { signInHref } from "@/lib/auth-navigation";
import { roleHome, type AccountRole } from "@/lib/roles";

export function PortalMismatch({ actual, requested }: { actual: AccountRole; requested: AccountRole }) {
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = requested === "PASSENGER" ? "/onboarding?role=PASSENGER" : requested === "DRIVER" ? "/onboarding?role=DRIVER" : "/admin";
  const wanted = requested === "ADMIN" ? "operator" : requested.toLowerCase();
  const current = actual === "ADMIN" ? "operator" : actual.toLowerCase();
  async function switchAccount() {
    setBusy(true); setError("");
    try { await signOut({ redirectUrl: signInHref(target) }); }
    catch { setError("We could not sign out. Please try again."); setBusy(false); }
  }
  return <div className="portal-access-page"><header className="portal-access-header"><Link className="wordmark" href="/">kootu<span className="brand-dot" /></Link><span>{wanted} portal</span></header>
    <main className="portal-access-card"><div className="portal-access-icon"><UserRound aria-hidden="true" /></div><p className="eyebrow">ACCOUNT CHECK</p><h1>You opened the {wanted} portal.</h1><p>This account is registered as a <strong>{current}</strong>. Sign in with a {wanted} account to continue here.</p><p className="quiet">Your saved role and rides stay unchanged. We won’t send you to a different dashboard automatically.</p>
      {error && <p role="alert">{error}</p>}
      <button className="action" disabled={busy} onClick={() => void switchAccount()}>{busy ? "Signing out…" : `Sign in as a ${wanted}`}<ArrowRight size={16} aria-hidden="true" /></button>
      <Link className="portal-access-secondary" href={roleHome(actual)}>Return to your {current} dashboard</Link>
    </main></div>;
}
