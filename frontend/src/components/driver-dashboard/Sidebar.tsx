"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      href: "/driver",
      isActive: pathname === "/driver" || pathname === "/",
      icon: (active: boolean) => (
        <svg
          className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect height="7" rx="1.5" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" width="7" x="14" y="14" />
        </svg>
      ),
    },
    {
      id: "ride-requests",
      label: "Ride Requests",
      href: "/driver/ride-requests",
      isActive: pathname === "/driver/ride-requests" || pathname === "/ride-requests",
      icon: (active: boolean) => (
        <svg
          className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 11l1.5-5h11L19 11M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6M5 11h14M7.5 14h.01M16.5 14h.01"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "my-trips",
      label: "My Trips",
      href: "/driver/my-trips",
      isActive: pathname === "/driver/my-trips" || pathname === "/my-trips",
      icon: (active: boolean) => (
        <svg
          className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="6" cy="19" r="2.5" />
          <circle cx="18" cy="5" r="2.5" />
          <path
            d="M8.5 17.5l7-10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "earnings",
      label: "Earnings",
      href: "/driver/earnings",
      isActive: pathname === "/driver/earnings" || pathname === "/earnings",
      icon: (active: boolean) => (
        <svg
          className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2v20m5-16.5a3.5 3.5 0 00-5 0v5a3.5 3.5 0 01-5 0m5-5a3.5 3.5 0 015 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "ride-history",
      label: "Ride History",
      href: "/driver/ride-history",
      isActive: pathname === "/driver/ride-history" || pathname === "/ride-history",
      icon: (active: boolean) => (
        <svg
          className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 8v4l3 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.05 11a9 9 0 1 1 .5 4M3 5v6h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className="w-64 bg-sidebar text-white flex flex-col justify-between flex-shrink-0 h-full select-none z-20"
      data-purpose="sidebar-navigation"
    >
      {/* Top Navigation Section */}
      <div className="px-5 pt-7 pb-4 flex flex-col">
        {/* Logo Branding */}
        <Link
          href="/driver"
          onClick={onNavigate}
          className="flex items-center space-x-0.5 px-3 mb-8 group"
        >
          <span className="text-2xl font-black tracking-tight text-white group-hover:opacity-90 transition">
            KOOTU
          </span>
          <span className="text-[10px] font-bold align-top mt-[-8px]">®</span>
        </Link>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="space-y-1.5">
          {navItems.map((item) => {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  item.isActive
                    ? "bg-white/10 text-white border border-white/5 shadow-inner"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon(item.isActive)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Section (Support & Profile) */}
      <div className="px-4 pb-6 space-y-4">
        {/* Help & Support */}
        <Link
          href="/driver/help"
          onClick={onNavigate}
          className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            pathname === "/driver/help" || pathname === "/help"
              ? "bg-white/10 text-white border border-white/5"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Help &amp; Support</span>
        </Link>

        {/* Driver Profile Capsule */}
        <Link
          href="/driver/profile"
          onClick={onNavigate}
          className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
            pathname === "/driver/profile" || pathname === "/profile"
              ? "bg-white/10 border border-white/5"
              : "hover:bg-white/5"
          }`}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar Icon 'R' */}
            <div className="w-10 h-10 rounded-full bg-neutral-700/80 text-white font-medium flex items-center justify-center text-sm border border-neutral-600">
              R
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Rajesh Kumar
              </p>
              <p className="text-xs text-neutral-400 leading-tight mt-0.5">
                BLR Airport Fleet
              </p>
            </div>
          </div>
          {/* Right Arrow Icon */}
          <svg
            className="w-4 h-4 text-neutral-400 mr-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
