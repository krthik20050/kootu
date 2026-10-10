"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback } from "react";
import { AuthControls } from "@/components/auth-controls";
import { apiRequest } from "@/lib/api/client";
import { Passenger } from "./passenger";
import { DriverDesk } from "./driver";
import { AdminDesk } from "./admin";

import type { Api } from "./shared";

function SignedWorkspace({ area }: { area: "passenger" | "driver" | "admin" }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
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
        <p className="eyebrow">YOUR JOURNEY</p>
        <h1>
          Start with
          <br />
          <em>a hello.</em>
        </h1>
        <p>
          Sign in to save your arrival, find a group and keep track of your
          ride.
        </p>
        <SignInButton mode="modal">
          <button className="action">Sign in to continue</button>
        </SignInButton>
      </section>
    );
  return area === "passenger" ? (
    <Passenger api={api} />
  ) : area === "driver" ? (
    <DriverDesk api={api} />
  ) : (
    <AdminDesk api={api} />
  );
}

export function Workspace({
  area,
}: {
  area: "passenger" | "driver" | "admin";
}) {
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
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
            href="/passenger"
            aria-current={area === "passenger" ? "page" : undefined}
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
          <SignedWorkspace area={area} />
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
