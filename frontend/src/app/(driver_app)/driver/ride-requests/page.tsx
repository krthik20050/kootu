"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";
import { useConnection } from "@/components/driver-dashboard/context/ConnectionContext";

export default function RideRequestsPage() {
  const { isGatewayConnected, isChecking, checkConnection, openDiagnostics } = useConnection();
  const [terminalFilter, setTerminalFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const resetFilters = () => {
    setTerminalFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  return (
    <AppShell title="Ride Requests" subtitle="DISPATCH QUEUE">
      {/* Gateway Status Banner */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <span
              className={`w-3 h-3 rounded-full ${
                isGatewayConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {isGatewayConnected
                ? "Live Dispatch Connected"
                : "Live Dispatch Gateway Disconnected"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isGatewayConnected
                ? "Listening for inbound airport ride dispatches."
                : "Real-time dispatch requests stream requires an active backend server (/api/driver/stream)."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => checkConnection()}
            disabled={isChecking}
            type="button"
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isChecking && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <span>{isChecking ? "Testing..." : "Test Dispatch Gateway"}</span>
          </button>
          <button
            onClick={openDiagnostics}
            type="button"
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Diagnostics
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by flight number, destination, or terminal..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={terminalFilter}
              onChange={(e) => setTerminalFilter(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Terminals</option>
              <option value="T1">Terminal 1 (Domestic)</option>
              <option value="T2">Terminal 2 (International)</option>
              <option value="T3">Terminal 3 (Cargo/Express)</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="sedan">Airport Sedan</option>
              <option value="suv">Airport SUV</option>
              <option value="xl">Airport XL Shuttle</option>
            </select>

            <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-900">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === "cards"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
                title="Card View"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="7" rx="1" width="7" x="3" y="3" />
                  <rect height="7" rx="1" width="7" x="14" y="3" />
                  <rect height="7" rx="1" width="7" x="3" y="14" />
                  <rect height="7" rx="1" width="7" x="14" y="14" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === "table"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
                title="Table View"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(terminalFilter !== "all" || categoryFilter !== "all" || searchQuery !== "") && (
          <div className="flex items-center space-x-2 pt-2 border-t border-borderLight dark:border-borderLight-dark text-xs">
            <span className="text-neutral-500">Active filters:</span>
            {terminalFilter !== "all" && (
              <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center space-x-1">
                <span>Terminal: {terminalFilter}</span>
                <button onClick={() => setTerminalFilter("all")}>×</button>
              </span>
            )}
            {categoryFilter !== "all" && (
              <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center space-x-1">
                <span>Category: {categoryFilter}</span>
                <button onClick={() => setCategoryFilter("all")}>×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center space-x-1">
                <span>Search: &quot;{searchQuery}&quot;</span>
                <button onClick={() => setSearchQuery("")}>×</button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white ml-2 underline text-[11px]"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Requests Content Section */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-10 border border-borderLight dark:border-borderLight-dark flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path
              d="M5 11l1.5-5h11L19 11M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6M5 11h14M7.5 14h.01M16.5 14h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          No Inbound Ride Requests
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-md leading-relaxed">
          {isGatewayConnected
            ? "There are currently no active dispatch requests matching your criteria. Stay within the terminal waiting queue."
            : "The driver dashboard is currently disconnected from the live dispatch gateway. Inbound ride broadcasts are inactive until the driver backend service (/api/driver/stream) is connected."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => checkConnection()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition"
          >
            Probe Dispatch Endpoint
          </button>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Clear Search Filters
          </button>
        </div>
      </div>
    </AppShell>
  );
}
