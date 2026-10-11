"use client";
import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDashboardTheme } from "@/components/ui/app-1-utils/dashboard-theme";
export default function AppShell({ children, title = "Overview" }: { children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useDashboardTheme();
  return <div className="app1-dashboard driver-dashboard" data-theme={theme}>
    <a className="skip-link" href="#driver-workspace">Skip to content</a>
    <aside className="driver-desktop-sidebar"><Sidebar /></aside>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="app1-dashboard driver-mobile-sidebar" data-theme={theme}><SheetTitle className="sr-only">Driver navigation</SheetTitle><Sidebar onNavigate={() => setOpen(false)} /></SheetContent></Sheet>
    <div className="driver-content"><Header title={title} theme={theme} toggleTheme={toggleTheme} onOpenMobileMenu={() => setOpen(true)} />
      <main id="driver-workspace" className="workspace driver-main">{children}</main></div>
  </div>;
}
