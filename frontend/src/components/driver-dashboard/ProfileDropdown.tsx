"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection } from "./context/ConnectionContext";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const router = useRouter();
  const { openDiagnostics } = useConnection();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
        setShowDisconnectConfirm(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        setShowDisconnectConfirm(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-16 right-10 w-64 bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-2xl shadow-xl z-50 overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Profile Header */}
      <div className="p-4 border-b border-borderLight dark:border-borderLight-dark">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm">
            R
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold truncate">Rajesh Kumar</h4>
            <p className="text-xs text-neutral-500 truncate">rajesh.kumar@kootu-fleet.in</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-2 space-y-1 text-xs">
        <Link
          href="/driver/profile"
          onClick={onClose}
          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Driver Profile</span>
        </Link>

        <Link
          href="/driver/profile#documents"
          onClick={onClose}
          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Vehicle & Documents</span>
        </Link>

        <Link
          href="/driver/earnings"
          onClick={onClose}
          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Earnings & Payouts (₹)</span>
        </Link>

        <button
          onClick={() => {
            onClose();
            openDiagnostics();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium text-left"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="7" rx="1.5" width="7" x="3" y="3" />
            <rect height="7" rx="1.5" width="7" x="14" y="3" />
            <rect height="7" rx="1.5" width="7" x="3" y="14" />
            <rect height="7" rx="1.5" width="7" x="14" y="14" />
          </svg>
          <span>Gateway Diagnostics</span>
        </button>
      </div>

      {/* Disconnect Footer */}
      <div className="p-2 border-t border-borderLight dark:border-borderLight-dark">
        {showDisconnectConfirm ? (
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl space-y-2">
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
              Disconnect driver workspace session?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowDisconnectConfirm(false);
                  onClose();
                  router.push("/driver");
                }}
                className="flex-1 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-semibold"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-1 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium text-xs text-left"
          >
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Disconnect Session</span>
          </button>
        )}
      </div>
    </div>
  );
}
