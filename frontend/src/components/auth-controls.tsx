"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signInHref } from "@/lib/auth-navigation";

export function AuthControls() {
  const pathname = usePathname();
  return <>
    <Show when="signed-out"><Link className="auth-button" href={signInHref(pathname)}>Sign in</Link></Show>
    <Show when="signed-in"><UserButton /></Show>
  </>;
}
