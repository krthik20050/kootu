"use client";

import React, { useEffect } from "react";
import { useConnection } from "./context/ConnectionContext";

export default function ConnectionDiagnosticsModal() {
  const {
    diagnosticsOpen,
    closeDiagnostics,
    isGatewayConnected,
    isChecking,
    lastChecked,
    connectionError,
    checkConnection,
  } = useConnection();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && diagnosticsOpen) {
        closeDiagnostics();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diagnosticsOpen, closeDiagnostics]);

  if (!diagnosticsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-lg bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-3xl shadow-2xl p-6 sm:p-8 text-neutral-900 dark:text-neutral-100 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostics-title"
      >
        {/* Close Button */}
        <button
          onClick={closeDiagnostics}
          className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-800 dark:text-neutral-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="7" rx="1.5" width="7" x="3" y="3" />
              <rect height="7" rx="1.5" width="7" x="14" y="3" />
              <rect height="7" rx="1.5" width="7" x="3" y="14" />
              <rect height="7" rx="1.5" width="7" x="14" y="14" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block">
              SYSTEM DIAGNOSTICS
            </span>
            <h2 id="diagnostics-title" className="text-xl font-extrabold tracking-tight">
              Dispatch Gateway Status
            </h2>
          </div>
        </div>

        {/* Status Callout */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Gateway Connection
            </span>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isGatewayConnected ? "bg-emerald-500" : "bg-neutral-500"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isGatewayConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {isGatewayConnected
              ? "Live telemetry is connected. Driver can switch to Available status and receive dispatch opportunities."
              : "The driver dashboard cannot switch to 'Available' mode while disconnected from the dispatch server. Real-time trip matching requires an active telemetry gateway."}
          </p>

          {connectionError && (
            <div className="mt-3 p-3 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-mono break-words">
              {connectionError}
            </div>
          )}

          {lastChecked && (
            <p className="text-[11px] text-neutral-400 mt-2">
              Last probed: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Technical Dependencies Table */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Backend Dependencies
          </p>
          <div className="text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-200 dark:divide-neutral-800">
            <div className="p-3 flex justify-between items-center">
              <div>
                <span className="font-semibold block">Health Check</span>
                <span className="font-mono text-[11px] text-neutral-500">GET /api/health</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {isGatewayConnected ? "200 OK" : "Unreachable"}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <div>
                <span className="font-semibold block">Driver Telemetry</span>
                <span className="font-mono text-[11px] text-neutral-500">POST /api/driver/status</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Pending Gateway
              </span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <div>
                <span className="font-semibold block">Ride Dispatch Stream</span>
                <span className="font-mono text-[11px] text-neutral-500">WS /api/driver/stream</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Standby
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={closeDiagnostics}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Dismiss
          </button>
          <button
            onClick={() => checkConnection()}
            disabled={isChecking}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isChecking && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <span>{isChecking ? "Testing Endpoint..." : "Test Gateway Connection"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
