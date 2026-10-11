"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import { signInHref } from "@/lib/auth-navigation";
import { requiredRole, roleHome, type AccountRole } from "@/lib/roles";
import { PortalMismatch } from "./portal-mismatch";

// Mount protected children only after checking the server-owned account role.
export function RoleBoundary({ children }: { children: ReactNode }) {
  const path = usePathname();
  const required = requiredRole(path);
  return required ? <ProtectedRoute key={path} required={required}>{children}</ProtectedRoute> : children;
}

function ProtectedRoute({ children, required }: { children: ReactNode; required: AccountRole }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const router = useRouter();
  const [verified, setVerified] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<{ userId: string; role: AccountRole } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Sign in again to continue.");
        const profile = await apiRequest<{ role: AccountRole }>("/me", token);
        if (!active) return;
        if (profile.role === "UNASSIGNED") router.replace(required === "ADMIN" ? roleHome(profile.role) : `/onboarding?role=${required}`);
        else if (profile.role !== required) setMismatch({ userId: userId!, role: profile.role });
        else setVerified(userId || null);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Unable to verify your account."); }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId, getToken, required, router, attempt]);
  if (isLoaded && !isSignedIn) return <div className="portal-access-page"><header className="portal-access-header"><Link href="/" className="wordmark">kootu<span className="brand-dot" /></Link><span>{required.toLowerCase()} portal</span></header><main className="portal-access-card"><p className="eyebrow">{required} WORKSPACE</p><h1>{required === "PASSENGER" ? "Your next arrival starts here." : "Sign in to your workspace."}</h1><p>{required === "PASSENGER" ? "Plan a shared ride, follow your group and see all your journeys in one place." : "Use your registered account to continue."}</p><Link className="action" href={signInHref(required === "ADMIN" ? "/admin" : `/onboarding?role=${required}`)}>Sign in as a {required.toLowerCase()}</Link></main></div>;
  if (mismatch && mismatch.userId === userId) return <PortalMismatch key={userId} actual={mismatch.role} requested={required} />;
  if (error) return <main className="workspace"><p role="alert">{error}</p><button className="action" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></main>;
  if (!isLoaded || !userId || verified !== userId) return <main className="workspace"><p role="status">Opening your workspace…</p></main>;
  return children;
}
