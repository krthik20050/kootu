"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";

interface HistoryRecord {
  id: string;
  date: string;
  route: string;
  terminal: string;
  distance: string;
  duration: string;
  baseFare: string;
  surcharges: string;
  tip: string;
  total: string;
  passenger: string;
}

const mockHistory: HistoryRecord[] = [
  {
    id: "TRIP-BLR-7994",
    date: "10 Oct 2026, 18:15",
    route: "Terminal 1 → Whitefield ITPL Tech Park",
    terminal: "Terminal 1",
    distance: "38.4 km",
    duration: "52 mins",
    baseFare: "₹1,650",
    surcharges: "₹120",
    tip: "₹150",
    total: "₹1,920",
    passenger: "Vikram Malhotra",
  },
  {
    id: "TRIP-BLR-7820",
    date: "10 Oct 2026, 09:45",
    route: "Terminal 2 → Manyata Tech Park, Hebbal",
    terminal: "Terminal 2",
    distance: "29.2 km",
    duration: "38 mins",
    baseFare: "₹1,180",
    surcharges: "₹120",
    tip: "₹50",
    total: "₹1,350",
    passenger: "Ananya Deshmukh",
  },
  {
    id: "TRIP-BLR-7701",
    date: "09 Oct 2026, 21:05",
    route: "Terminal 2 → Koramangala 4th Block",
    terminal: "Terminal 2",
    distance: "41.0 km",
    duration: "58 mins",
    baseFare: "₹1,820",
    surcharges: "₹120",
    tip: "₹200",
    total: "₹2,140",
    passenger: "Arjun Patel",
  },
  {
    id: "TRIP-BLR-7650",
    date: "09 Oct 2026, 14:20",
    route: "Terminal 1 → MG Road / Brigade Road",
    terminal: "Terminal 1",
    distance: "34.8 km",
    duration: "46 mins",
    baseFare: "₹1,410",
    surcharges: "₹120",
    tip: "₹100",
    total: "₹1,630",
    passenger: "Deepa Krishnan",
  },
];

export default function RideHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [terminalFilter, setTerminalFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState<HistoryRecord | null>(null);

  const filteredHistory = mockHistory.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.passenger.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerminal =
      terminalFilter === "all" || item.terminal.toLowerCase().includes(terminalFilter.toLowerCase());
    return matchesSearch && matchesTerminal;
  });

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "TripID,Date,Route,Terminal,Distance,Duration,BaseFare,FASTagToll,Tip,TotalINR,Passenger\n" +
      filteredHistory
        .map(
          (h) =>
            `${h.id},"${h.date}","${h.route}","${h.terminal}",${h.distance},${h.duration},${h.baseFare},${h.surcharges},${h.tip},${h.total},"${h.passenger}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kootu_ride_history_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="Ride History" subtitle="ARCHIVED LOGS">
      {/* Controls Bar */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              placeholder="Search by Trip ID, route, or passenger..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={terminalFilter}
              onChange={(e) => setTerminalFilter(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Terminals</option>
              <option value="terminal 1">Terminal 1</option>
              <option value="terminal 2">Terminal 2</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center space-x-1.5 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
            Completed Trips Log ({filteredHistory.length})
          </h3>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No past journeys found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-neutral-500 uppercase tracking-wider border-b border-borderLight dark:border-borderLight-dark pb-2 font-bold">
                <tr>
                  <th className="py-3 px-3">Trip ID</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Route</th>
                  <th className="py-3 px-3">Distance</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Total Fare</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight dark:divide-borderLight-dark text-neutral-800 dark:text-neutral-200">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                    <td className="py-3.5 px-3 font-mono font-bold">{item.id}</td>
                    <td className="py-3.5 px-3 text-neutral-500">{item.date}</td>
                    <td className="py-3.5 px-3 font-medium">{item.route}</td>
                    <td className="py-3.5 px-3 text-neutral-500">{item.distance}</td>
                    <td className="py-3.5 px-3 text-neutral-500">{item.duration}</td>
                    <td className="py-3.5 px-3 font-extrabold text-neutral-900 dark:text-white">
                      {item.total}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-semibold text-[11px]"
                      >
                        Tax Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-3xl shadow-2xl p-6 sm:p-7 text-neutral-900 dark:text-neutral-100 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Close invoice"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="text-center pb-4 border-b border-borderLight dark:border-borderLight-dark">
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block">
                KOOTU® TRIP INVOICE
              </span>
              <h3 className="text-lg font-extrabold mt-1">{selectedReceipt.id}</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">{selectedReceipt.date}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Passenger</span>
                <span className="font-semibold">{selectedReceipt.passenger}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Route</span>
                <span className="font-semibold text-right max-w-[180px] truncate">
                  {selectedReceipt.route}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Distance & Duration</span>
                <span className="font-semibold">
                  {selectedReceipt.distance} ({selectedReceipt.duration})
                </span>
              </div>
              <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex justify-between">
                <span className="text-neutral-500">Base Meter Fare</span>
                <span>{selectedReceipt.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">FASTag Airport Toll</span>
                <span>{selectedReceipt.surcharges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rider Tip</span>
                <span>{selectedReceipt.tip}</span>
              </div>
              <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between font-extrabold text-sm">
                <span>Total Received</span>
                <span>{selectedReceipt.total}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-black dark:hover:bg-neutral-200 transition"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
