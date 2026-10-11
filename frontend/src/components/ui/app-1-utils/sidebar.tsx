"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext({ open: false, collapsed: false, toggle: () => {} });
export function useSidebar() { return React.useContext(SidebarContext); }
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const toggle = () => {
    if (window.matchMedia("(min-width: 768px)").matches) setCollapsed(value => !value);
    else setOpen(value => !value);
  };
  return <SidebarContext.Provider value={{ open, collapsed, toggle }}>
    <div className="flex min-h-svh w-full bg-background text-foreground">{children}</div>
  </SidebarContext.Provider>;
}
export function SidebarInset({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-1 flex-col", className)}>{children}</div>;
}
export function SidebarTrigger(props: React.ComponentProps<typeof Button>) {
  const { toggle } = useSidebar();
  return <Button variant="ghost" size="icon" onClick={toggle} {...props}><PanelLeft className="size-4" /></Button>;
}
