"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function HomeAccount() {
  return <>
    <Show when="signed-out"><Link href="/sign-in?next=%2Fonboarding">Sign in <span aria-hidden="true">↗</span></Link></Show>
    <Show when="signed-in"><Link href="/onboarding">My workspace <span aria-hidden="true">↗</span></Link><UserButton /></Show>
  </>;
}
