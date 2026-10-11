import { Suspense } from "react";
import { AccountOnboarding } from "@/components/account-onboarding";

export default function OnboardingPage() {
  return <Suspense fallback={<main className="workspace">Loading account…</main>}><AccountOnboarding /></Suspense>;
}
