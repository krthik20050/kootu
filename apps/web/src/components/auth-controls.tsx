"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthControls() {
  return <>
    <Show when="signed-out"><SignInButton mode="modal"><button className="auth-button">Sign in</button></SignInButton></Show>
    <Show when="signed-in"><UserButton /></Show>
  </>;
}
