"use client";

import React, { useState } from "react";
import { useTheme } from "./context/ThemeContext";
import { useConnection } from "./context/ConnectionContext";
import { useNotifications } from "./context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export default function Header({
  title = "Overview",
  subtitle = "DRIVER WORKSPACE",
  onOpenMobileMenu,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isGatewayConnected, status, toggleAvailability } = useConnection();
  const { unreadCount, toggleNotifications } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header
      className="h-20 bg-canvas dark:bg-canvas-dark px-4 sm:px-10 flex items-center justify-between flex-shrink-0 border-b border-borderLight dark:border-borderLight-dark select-none relative z-30 transition-colors"
      data-purpose="top-header"
    >
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center space-x-3.5">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div>
          <p className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
            {subtitle}
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3.5">
        {/* Status Switch Capsule */}
        <button
          onClick={toggleAvailability}
          title={
            isGatewayConnected
              ? `Status: ${status === "available" ? "Online" : "Offline"}`
              : "Status: Unavailable (Dispatch Gateway Offline - Click to inspect)"
          }
          type="button"
          className="flex items-center space-x-2.5 bg-neutral-200/70 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700 rounded-full px-3 sm:px-3.5 py-1.5 shadow-xs cursor-pointer select-none hover:border-neutral-400 dark:hover:border-neutral-600 transition"
        >
          <span
            className={`w-2 h-2 rounded-full inline-block transition-colors ${
              isGatewayConnected && status === "available"
                ? "bg-emerald-500"
                : "bg-neutral-600 dark:bg-neutral-400"
            }`}
          />
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
            {isGatewayConnected && status === "available" ? "Available" : "Unavailable"}
          </span>
          <div
            className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
              isGatewayConnected && status === "available"
                ? "bg-emerald-500 justify-end"
                : "bg-neutral-500 dark:bg-neutral-600 justify-start"
            }`}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
          </div>
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300/50 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition"
          type="button"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4 text-neutral-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-4 h-4 fill-current text-neutral-800" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Notifications Button with Dot */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            aria-label="Notifications"
            title="Driver notifications"
            className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300/50 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 relative transition"
            type="button"
          >
            <svg
              className="w-4 h-4 text-neutral-800 dark:text-neutral-200"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-neutral-900 dark:bg-white rounded-full border border-white dark:border-neutral-900" />
            )}
          </button>
          <NotificationDropdown />
        </div>

        {/* Profile Avatar Badge */}
        <div className="relative">
          <div
            onClick={() => setProfileOpen((prev) => !prev)}
            title="Open driver profile menu"
            className="w-10 h-10 rounded-full bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 font-bold text-sm cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
          >
            R
          </div>
          <ProfileDropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
      </div>
    </header>
  );
}
