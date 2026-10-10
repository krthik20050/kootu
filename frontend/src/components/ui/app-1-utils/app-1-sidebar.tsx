"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, LayoutDashboard, Layers, Plane, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "./sidebar";
import { app1User } from "./app-1-data";
import { useDashboardTheme } from "./dashboard-theme";

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="flex h-full flex-col gap-8 p-5">
    <Link href="/" className="flex items-center gap-3 text-xl font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Layers className="size-5" /></span>kootu<span className="text-primary">.</span></Link>
    <div className="flex flex-col gap-2">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace</p>
      {[{ href: "#overview", label: "Overview", icon: LayoutDashboard }, { href: "#projects", label: "Projects", icon: Layers }, { href: "#activity", label: "Activity", icon: Activity }].map(({ href, label, icon: Icon }) => <a key={href} href={href} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${label === "Overview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><Icon className="size-4" />{label}</a>)}
      <Link href="/request" className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Plane className="size-4" />Request a ride<ArrowUpRight className="ml-auto size-4" /></Link>
    </div>
    <div className="mt-auto rounded-xl border bg-background p-4"><Sparkles className="mb-3 size-5 text-primary" /><p className="text-sm font-semibold">Room for your next idea</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">A sample workspace to explore your dashboard.</p></div>
    <div className="flex items-center gap-3 border-t pt-4"><Avatar className="size-9"><AvatarFallback>{app1User.initials}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{app1User.name}</p><p className="text-xs text-muted-foreground">Demo workspace</p></div></div>
  </div>;
}
export function App1Sidebar() {
  const { theme } = useDashboardTheme();
  const { open, collapsed, toggle } = useSidebar();
  return <>
    <aside className={`${collapsed ? "hidden" : "hidden md:block"} sticky top-0 h-svh w-60 shrink-0 border-r bg-card`}><Navigation /></aside>
    <Sheet open={open} onOpenChange={toggle}><SheetContent side="left" data-theme={theme} className="app1-dashboard w-72 p-0 md:hidden"><SheetTitle className="sr-only">Dashboard navigation</SheetTitle><Navigation onNavigate={toggle} /></SheetContent></Sheet>
  </>;
}
