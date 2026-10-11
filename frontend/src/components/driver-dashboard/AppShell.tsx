"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import ConnectionDiagnosticsModal from "./ConnectionDiagnosticsModal";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppShell({
  children,
  title = "Overview",
  subtitle = "DRIVER WORKSPACE",
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas dark:bg-canvas-dark text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileSidebarDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10 pt-6 space-y-6">
          {children}
        </main>
      </div>

      {/* Diagnostics Modal */}
      <ConnectionDiagnosticsModal />
    </div>
  );
}
