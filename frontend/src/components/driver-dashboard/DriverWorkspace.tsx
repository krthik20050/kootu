"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { signInHref } from "@/lib/auth-navigation";
import { DriverDesk, type DriverView } from "@/components/workspace/driver";
import type { Api } from "@/components/workspace/shared";
function DriverSession({ view }: { view: DriverView }) {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const api: Api = useCallback(async (path, options) => {
    const token = await getToken();
    if (!token) throw new Error("Sign in again to continue.");
    return apiRequest(path, token, options);
  }, [getToken]);
  if (!isLoaded) return <p role="status">Loading your session…</p>;
  if (!isSignedIn) return <section className="driver-panel"><h2>Sign in to your driver workspace</h2><p>Manage your vehicle, availability and assigned rides.</p><Link className="action" href={signInHref("/driver")}>Continue to sign in</Link></section>;
  return <><p className="driver-greeting">Welcome, {user?.fullName || user?.firstName || "driver"}.</p><DriverDesk key={`${userId}:${view}`} api={api} view={view} /></>;
}
export default function DriverWorkspace({ view = "overview" }: { view?: DriverView }) {
  return process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ? <DriverSession view={view} /> : <section className="driver-panel"><h2>Sign-in is not configured</h2><p>Driver operations require a configured account and operator approval.</p></section>;
}
