"use client";
import { Menu, Moon, Sun } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
export default function Header({ title, onOpenMobileMenu, theme, toggleTheme }: {
  title: string; onOpenMobileMenu: () => void; theme: string; toggleTheme: () => void;
}) {
  return <header className="driver-header"><button type="button" className="driver-menu" aria-label="Open navigation menu" onClick={onOpenMobileMenu}><Menu /></button>
    <div><p className="eyebrow">DRIVER WORKSPACE</p><h1>{title}</h1></div>
    <div className="driver-header-actions"><button type="button" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>{theme === "dark" ? <Sun /> : <Moon />}</button>
    {process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" && <AuthControls />}</div></header>;
}
