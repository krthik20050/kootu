"use client";

import { Show, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { roleHome, type AccountRole } from "@/lib/roles";

export function HomeAccount() {
  const { userId, getToken } = useAuth();
  const [account, setAccount] = useState<{ userId: string; role: AccountRole } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await apiRequest<{ role: AccountRole }>("/me", token);
        if (live) setAccount({ userId, role: me.role });
      } catch { /* The account entry still opens the retryable onboarding screen. */ }
    })();
    return () => { live = false; };
  }, [userId, getToken]);
  const role = account?.userId === userId ? account?.role : undefined;
  const label = role === "PASSENGER" ? "Passenger dashboard" : role === "DRIVER" ? "Driver dashboard" : role === "ADMIN" ? "Operator dashboard" : "Open your account";
  return <>
    <Show when="signed-out"><Link href="/sign-in?next=%2Fonboarding">Sign in <span aria-hidden="true">↗</span></Link></Show>
    <Show when="signed-in"><Link href={role ? roleHome(role) : "/onboarding"}>{label} <span aria-hidden="true">↗</span></Link><UserButton /></Show>
  </>;
}
