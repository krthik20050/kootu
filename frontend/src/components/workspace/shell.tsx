"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback } from "react";
import { AuthControls } from "@/components/auth-controls";
import { apiRequest } from "@/lib/api/client";
import { signInHref } from "@/lib/auth-navigation";
import { ChatPassenger } from "./chat-passenger";
import { Passenger } from "./passenger";
import { DriverDesk } from "./driver";
import { AdminDesk } from "./admin";
import { RequestFrame } from "./request-frame";

import type { Api } from "./shared";

function SignedWorkspace({ area, chat = false }: { chat?: boolean; area: "passenger" | "driver" | "admin" }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const api: Api = useCallback(
    async (path, options) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in again to continue.");
      return apiRequest(path, token, options);
    },
    [getToken],
  );
  if (!isLoaded) return <p role="status">Loading your session…</p>;
  if (!isSignedIn)
    return (
      <section className="setup-state">
        <p className="eyebrow">{area === "passenger" ? "YOUR AIRPORT RIDE" : area === "driver" ? "DRIVER WORKSPACE" : "OPERATOR WORKSPACE"}</p>
        <h1>{area === "passenger" ? "Find your shared ride." : area === "driver" ? "Manage your rides." : "Manage ride operations."}</h1>
        <p>
          {area === "passenger" ? "Sign in, add your flight and drop-off, then find passengers heading your way." : area === "driver" ? "Sign in to register your vehicle, manage availability and review ride offers." : "Sign in with your approved operator account to review drivers and vehicles."}
        </p>
        <Link className="action" href={signInHref(area === "passenger" ? "/request" : `/${area}`)}>Continue to sign in →</Link>
        <p className="quiet">Use Google or email. New to kootu? You can create an account on the next screen.</p>
      </section>
    );
  return area === "passenger" ? (
    chat ? <ChatPassenger api={api} accountName={user?.fullName || user?.firstName || ""} /> : <Passenger api={api} accountName={user?.fullName || user?.firstName || ""} />
  ) : area === "driver" ? (
    <DriverDesk api={api} />
  ) : (
    <AdminDesk api={api} />
  );
}

export function Workspace({
  area,
  chat = false,
}: {
  chat?: boolean;
  area: "passenger" | "driver" | "admin";
}) {
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
  if (area === "passenger") return (
    <RequestFrame>
      {enabled ? <SignedWorkspace area={area} chat={chat} /> : <section className="setup-state"><h2>Sign-in is not configured</h2><p>Booking will open once sign-in is configured. You can explore how sharing works while the team completes setup.</p><Link className="action" href="/#how-it-works">How it works ↗</Link></section>}
    </RequestFrame>
  );
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark">
          kootu
          <span className="brand-dot" />
        </Link>
        <nav className="workspace-nav" aria-label="Workspace">
          <Link
            href="/request"
          >
            Passenger
          </Link>
          <Link
            href="/driver"
            aria-current={area === "driver" ? "page" : undefined}
          >
            Driver
          </Link>
          {area === "admin" && (
            <Link href="/admin" aria-current="page">
              Operator
            </Link>
          )}
        </nav>
        {enabled && <AuthControls />}
      </header>
      <main id="workspace" className="workspace">
        {enabled ? (
          <SignedWorkspace area={area} chat={chat} />
        ) : (
          <section className="setup-state">
            <p className="eyebrow">WELCOME TO KOOTU</p>
            <h1>
              One arrival.
              <br />
              <em>A shared journey.</em>
            </h1>
            <p>
              Booking will open once sign-in is configured. You can explore how
              sharing works while the team completes setup.
            </p>
            <Link href="/#how-it-works" className="action">
              How it works ↗
            </Link>
          </section>
        )}
      </main>
      <footer>
        <Link href="/" className="footer-brand">
          kootu
        </Link>
        <span>Arrivals, with a little company.</span>
      </footer>
    </>
  );
}
