import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { workspaceReturn } from "@/lib/auth-navigation";

export function AuthPage({ mode, next }: { mode: "sign-in" | "sign-up"; next?: unknown }) {
  const target = workspaceReturn(next);
  const driver = target.startsWith("/driver") || target === "/onboarding?role=DRIVER";
  const operator = target === "/admin";
  const query = `?next=${encodeURIComponent(target)}`;
  const enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
  const steps = driver
    ? ["Register your vehicle", "Wait for operator approval", "Review compatible ride offers"]
    : operator
      ? ["Use your approved account", "Review drivers and vehicles", "Monitor ride operations"]
      : ["Add your flight and drop-off", "Tell us what you need", "Find a compatible shared ride"];
  return (
    <>
      <a className="skip-link" href="#authentication">Skip to sign in</a>
      <header className="site-header">
        <Link href="/" className="wordmark">kootu<span className="brand-dot" /></Link>
        <Link href={target} className="auth-back">← Back to {driver ? "drivers" : operator ? "operations" : "your ride"}</Link>
      </header>
      <main id="authentication" className="auth-layout">
        <section className="auth-context">
          <p className="eyebrow">{!driver && !operator ? "AIRPORT SHARED RIDES" : driver ? "DRIVE WITH KOOTU" : "KOOTU OPERATIONS"}</p>
          <h1>{!driver && !operator ? "Your arrival. A shared ride." : driver ? "Your next ride starts here." : "Your operations workspace."}</h1>
          <p>Your saved account type opens the right workspace after sign-in. New accounts choose passenger or driver during setup.</p>
          <ol className="auth-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol>
          {!driver && !operator && <p className="quiet">Have your ticket ready? Upload it after sign-in to fill your flight details, then check them before saving.</p>}
        </section>
        <section className="auth-form-panel" aria-label={mode === "sign-in" ? "Sign in" : "Create an account"}>
          <p className="auth-help">Use Google for fewer steps, or continue with email.</p>
          {!enabled ? <p role="status">Sign-in is not enabled in this preview. <Link href={target}>Return to kootu</Link>.</p> : mode === "sign-in" ? (
            <SignIn routing="hash" signUpUrl={`/sign-up${query}`} forceRedirectUrl={target} signUpForceRedirectUrl={target} />
          ) : (
            <SignUp routing="hash" signInUrl={`/sign-in${query}`} forceRedirectUrl={target} signInForceRedirectUrl={target} />
          )}
        </section>
      </main>
      <footer><Link className="footer-brand" href="/">kootu</Link><span>Land together. Leave together.</span></footer>
    </>
  );
}
