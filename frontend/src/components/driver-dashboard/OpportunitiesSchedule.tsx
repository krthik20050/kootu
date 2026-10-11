"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useConnection } from "./context/ConnectionContext";

export default function OpportunitiesSchedule() {
  const { openDiagnostics, isGatewayConnected } = useConnection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2"
      data-purpose="details-grid"
    >
      {/* Left Container: Ride Opportunities */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase block">
              OPPORTUNITIES
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={openDiagnostics}
                className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
              >
                Inspect Gateway
              </button>
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Ride opportunities
          </h3>
          <p className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-1">
            Compatible airport rides, when they are ready for you.
          </p>
        </div>

        {/* Empty State Box */}
        <div className="mt-6 bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-neutral-800 dark:text-neutral-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="6" r="2.5" />
                <path
                  d="M8.5 16.5l7-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="border-l border-neutral-300 dark:border-neutral-700 pl-4 py-0.5">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                Ride opportunities will appear here.
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {isGatewayConnected
                  ? "Waiting for dispatch requests in your terminal zone."
                  : "Live driver dashboard data is not connected yet."}
              </p>
            </div>
          </div>
          <Link
            href="/driver/ride-requests"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition text-center whitespace-nowrap"
          >
            View Requests
          </Link>
        </div>
      </div>

      {/* Right Container: Upcoming Trips */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase block">
              SCHEDULE
            </span>
            <button
              onClick={handleRefresh}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition flex items-center space-x-1"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Upcoming trips
          </h3>
          <p className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-1">
            Confirmed journeys, arranged in one place.
          </p>
        </div>

        {/* Empty State Box */}
        <div className="mt-6 bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-neutral-800 dark:text-neutral-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <div className="border-l border-neutral-300 dark:border-neutral-700 pl-4 py-0.5">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                Your next trip will appear here.
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Upcoming trips will appear when live trip data is available.
              </p>
            </div>
          </div>
          <Link
            href="/driver/my-trips"
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-center whitespace-nowrap"
          >
            My Trips
          </Link>
        </div>
      </div>
    </section>
  );
}
