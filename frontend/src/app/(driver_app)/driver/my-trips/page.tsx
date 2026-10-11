"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";
import { useConnection } from "@/components/driver-dashboard/context/ConnectionContext";

interface TripItem {
  id: string;
  terminal: string;
  destination: string;
  time: string;
  passenger: string;
  fare: string;
  flight: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
}

const mockTrips: TripItem[] = [
  {
    id: "TRIP-BLR-8021",
    terminal: "Terminal 2 (Arrivals Gate 4 - BLR Airport)",
    destination: "Indiranagar 100ft Road, Bengaluru",
    time: "Today, 14:30",
    passenger: "Rahul Sharma",
    fare: "₹1,450",
    flight: "6E-2041 (IndiGo)",
    status: "scheduled",
  },
  {
    id: "TRIP-BLR-7994",
    terminal: "Terminal 1 (Drop-off Ramp - BLR Airport)",
    destination: "Electronic City Phase 1, Hosur Road",
    time: "Yesterday, 18:15",
    passenger: "Priya Nair",
    fare: "₹2,180",
    flight: "AI-504 (Air India)",
    status: "completed",
  },
  {
    id: "TRIP-BLR-7820",
    terminal: "Terminal 1 (Domestic Gate 2 - BLR Airport)",
    destination: "Whitefield ITPL Main Road",
    time: "10 Oct, 09:45",
    passenger: "Anand Varma",
    fare: "₹1,220",
    flight: "QP-1322 (Akasa Air)",
    status: "completed",
  },
];

export default function MyTripsPage() {
  const { isGatewayConnected } = useConnection();
  const [activeTab, setActiveTab] = useState<"scheduled" | "active" | "completed" | "cancelled">("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredTrips = mockTrips.filter((trip) => {
    const matchesTab = trip.status === activeTab;
    const matchesSearch =
      trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.flight.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleTripAction = (actionName: string) => {
    setActionNotice(
      `Cannot execute '${actionName}': Backend trip dispatch service is currently disconnected. State updates require connection to /api/driver/trips/${selectedTrip?.id}.`
    );
  };

  return (
    <AppShell title="My Trips" subtitle="TRIP MANAGEMENT">
      {/* Top Filter and Tab Bar */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borderLight dark:border-borderLight-dark pb-3">
          <div className="flex space-x-1.5 sm:space-x-2">
            {(["scheduled", "active", "completed", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setActionNotice(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                  activeTab === tab
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {tab} (
                {mockTrips.filter((t) => t.status === tab).length}
                )
              </button>
            ))}
          </div>

          <div className="text-xs text-neutral-500">
            {isGatewayConnected ? "Live trip sync active" : "Offline mode — Cached view"}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
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
            placeholder="Search trips by destination, flight number, passenger, or Trip ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {/* Trips List / Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-10 border border-borderLight dark:border-borderLight-dark flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-neutral-900 dark:text-white">
            No {activeTab} trips found
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
            {searchQuery
              ? "No trips matched your search filter."
              : `You have no ${activeTab} airport journeys at this moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => {
                setSelectedTrip(trip);
                setActionNotice(null);
              }}
              className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                    {trip.id}
                  </span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {trip.fare}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:underline">
                  {trip.destination}
                </h4>

                <div className="mt-3 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span className="truncate">{trip.terminal}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span>Flight: {trip.flight}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-borderLight dark:border-borderLight-dark flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">{trip.time}</span>
                <span className="text-[11px] font-bold text-neutral-900 dark:text-white flex items-center space-x-1">
                  <span>View Details</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-3xl shadow-2xl p-6 sm:p-8 text-neutral-900 dark:text-neutral-100 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => {
                setSelectedTrip(null);
                setActionNotice(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block">
                JOURNEY MANIFEST
              </span>
              <h3 className="text-xl font-extrabold mt-0.5">{selectedTrip.id}</h3>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 space-y-3 mb-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500">Pickup Terminal</span>
                <span className="font-semibold text-right">{selectedTrip.terminal}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500">Destination</span>
                <span className="font-semibold text-right">{selectedTrip.destination}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500">Inbound Flight</span>
                <span className="font-semibold text-right font-mono">{selectedTrip.flight}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500">Passenger</span>
                <span className="font-semibold text-right">{selectedTrip.passenger}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Estimated Gross Fare</span>
                <span className="font-extrabold text-sm">{selectedTrip.fare}</span>
              </div>
            </div>

            {actionNotice && (
              <div className="p-3 mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300">
                {actionNotice}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleTripAction("Cancel Journey")}
                type="button"
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel Journey
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTripAction("Start Navigation")}
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition"
                >
                  Start Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
