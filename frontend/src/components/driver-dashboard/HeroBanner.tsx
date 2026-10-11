"use client";

import React from "react";
import { useConnection } from "./context/ConnectionContext";

export default function HeroBanner() {
  const { isGatewayConnected, openDiagnostics } = useConnection();

  return (
    <section
      className="hero-diagonal relative rounded-3xl border border-borderLight dark:border-borderLight-dark shadow-sm px-6 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden transition-colors"
      data-purpose="hero-banner"
    >
      {/* Left Content */}
      <div className="max-w-xl z-10">
        <span className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase block mb-3">
          YOUR KOOTU WORKSPACE
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
          Your next journey
          <br />
          starts somewhere.
        </h2>
        <p className="text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-3.5 leading-relaxed">
          Your driver workspace for airport ride opportunities and upcoming journeys.
        </p>
      </div>

      {/* Right Connected Status Box */}
      <div className="mt-6 md:mt-0 z-10 w-full md:w-auto">
        <div
          onClick={openDiagnostics}
          title="Click to view connection diagnostics"
          className="bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl p-4 md:px-5 md:py-4 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center space-x-4 max-w-sm cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition shadow-xs"
        >
          <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-neutral-900 dark:text-white"
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
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              DASHBOARD CONNECTION
            </p>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight mt-0.5 flex items-center space-x-2">
              <span>{isGatewayConnected ? "Connected" : "Not connected"}</span>
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  isGatewayConnected ? "bg-emerald-500" : "bg-neutral-400"
                }`}
              />
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-normal truncate">
              {isGatewayConnected
                ? "Telemetry gateway active."
                : "Dashboard data is not connected yet."}
            </p>
          </div>
          <div className="text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
