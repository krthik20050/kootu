"use client";

import Link from "next/link";
import styles from "./passenger-shell.module.css";
import type { ReactNode } from "react";
import { LayoutDashboard, Moon, Plane, Sun, Route, Ticket, UserRound } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/app-1-utils/sidebar";
import { useDashboardTheme } from "@/components/ui/app-1-utils/dashboard-theme";

function RequestNavigation({ onNavigate, area }: { onNavigate?: () => void; area: "request" | "dashboard" }) {
  return <div className={styles.navigation}>
    <Link href="/" className={styles.brand} aria-label="kootu home">kootu<span>.</span></Link>
    <nav aria-label="Passenger navigation"><p>YOUR WORKSPACE</p>
      <Link href="/dashboard" aria-current={area === "dashboard" ? "page" : undefined} onClick={onNavigate}><LayoutDashboard />Overview</Link>
      <Link href="/request" aria-current={area === "request" ? "page" : undefined} onClick={onNavigate}><Plane />Plan a ride</Link>
      <Link href="/passenger" onClick={onNavigate}><Ticket />Ticket booking</Link>
      <a href={area === "dashboard" ? "#rides-title" : "/dashboard#rides-title"} onClick={onNavigate}><Route />Journey history</a>
    </nav>
    <div className={styles.note}><strong>A little company goes a long way.</strong><p>Shared airport rides, built around where you’re heading.</p></div>
  </div>;
}

function RequestLayout({ children, area }: { children: ReactNode; area: "request" | "dashboard" }) {
  const { theme, toggleTheme } = useDashboardTheme();
  const { open, collapsed, toggle } = useSidebar();
  return <>
    <aside className={`${collapsed ? "hidden" : "hidden md:block"} sticky top-0 h-svh w-60 shrink-0 border-r bg-card`}><RequestNavigation area={area} /></aside>
    <Sheet open={open} onOpenChange={toggle}><SheetContent side="left" data-theme={theme} className="app1-dashboard w-72 p-0 md:hidden"><SheetTitle className="sr-only">Request navigation</SheetTitle><RequestNavigation area={area} onNavigate={toggle} /></SheetContent></Sheet>
    <SidebarInset className="min-w-0">
      <header className={styles.header}>
        <div className={styles.headerStart}><SidebarTrigger aria-label="Toggle passenger navigation" /><span aria-hidden="true" /><h1>{area === "dashboard" ? "Passenger overview" : "Plan your ride"}</h1></div>
        <div className={styles.headerActions}><span><UserRound size={12} aria-hidden="true" />Passenger</span><Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>{theme === "dark" ? <Sun /> : <Moon />}</Button><div className={styles.account}>{process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" && <AuthControls />}</div></div>
      </header>
      <main id="workspace" className={area === "dashboard" ? styles.content : `workspace ${styles.bookingContent}`}>{children}</main>
    </SidebarInset>
  </>;
}

export function RequestFrame({ children, area = "request" }: { children: ReactNode; area?: "request" | "dashboard" }) {
  const { theme } = useDashboardTheme();
  return <div className={`app1-dashboard request-workspace ${area === "dashboard" ? "passenger-dashboard" : ""}`} data-theme={theme}><a className="skip-link" href="#workspace">Skip to content</a><SidebarProvider><RequestLayout area={area}>{children}</RequestLayout></SidebarProvider></div>;
}
