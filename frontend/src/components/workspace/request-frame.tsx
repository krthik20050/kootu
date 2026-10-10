"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, Layers, Moon, Plane, Sun, Route } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/app-1-utils/sidebar";
import { useDashboardTheme } from "@/components/ui/app-1-utils/dashboard-theme";

function RequestNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="flex h-full flex-col gap-8 p-5">
    <Link href="/" className="flex items-center gap-3 text-xl font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Layers className="size-5" /></span>kootu<span className="text-primary">.</span></Link>
    <nav aria-label="Workspace" className="flex flex-col gap-2">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace</p>
      <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"><LayoutDashboard className="size-4" />Dashboard</Link>
      <Link href="/request" aria-current="page" onClick={onNavigate} className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"><Plane className="size-4" />Request a ride</Link>
      <a href="#rides-title" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"><Route className="size-4" />Your journeys</a>
    </nav>
    <div className="mt-auto rounded-xl border bg-background p-4"><Plane className="mb-3 size-5 text-primary" /><p className="text-sm font-semibold">Your next arrival</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Add your flight and drop-off, one question at a time.</p></div>
  </div>;
}

function RequestLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useDashboardTheme();
  const { open, collapsed, toggle } = useSidebar();
  return <>
    <aside className={`${collapsed ? "hidden" : "hidden md:block"} sticky top-0 h-svh w-60 shrink-0 border-r bg-card`}><RequestNavigation /></aside>
    <Sheet open={open} onOpenChange={toggle}><SheetContent side="left" data-theme={theme} className="app1-dashboard w-72 p-0 md:hidden"><SheetTitle className="sr-only">Request navigation</SheetTitle><RequestNavigation onNavigate={toggle} /></SheetContent></Sheet>
    <SidebarInset className="min-w-0">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
        <SidebarTrigger aria-label="Toggle navigation" /><h1 className="truncate text-lg font-semibold">Request a ride</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2"><Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>{theme === "dark" ? <Sun /> : <Moon />}</Button>{process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" && <AuthControls />}</div>
      </header>
      <main id="workspace" className="workspace request-workspace-content">{children}</main>
    </SidebarInset>
  </>;
}

export function RequestFrame({ children }: { children: ReactNode }) {
  const { theme } = useDashboardTheme();
  return <div className="app1-dashboard request-workspace" data-theme={theme}><a className="skip-link" href="#workspace">Skip to content</a><SidebarProvider><RequestLayout>{children}</RequestLayout></SidebarProvider></div>;
}
