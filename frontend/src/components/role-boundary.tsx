"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import { signInHref } from "@/lib/auth-navigation";
import { requiredRole, roleHome, type AccountRole } from "@/lib/roles";

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
        if (profile.role !== required) router.replace(roleHome(profile.role));
        else setVerified(userId || null);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Unable to verify your account."); }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId, getToken, required, router, attempt]);
  if (isLoaded && !isSignedIn) return <main className="workspace"><h1>Sign in to continue</h1><p>Your account opens its own passenger or driver workspace.</p><Link className="action" href={signInHref("/onboarding")}>Sign in or register</Link></main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p><button className="action" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></main>;
  if (!isLoaded || !userId || verified !== userId) return <main className="workspace"><p role="status">Opening your workspace…</p></main>;
  return children;
}
