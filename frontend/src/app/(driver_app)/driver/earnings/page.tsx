"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";
import { useConnection } from "@/components/driver-dashboard/context/ConnectionContext";

export default function EarningsPage() {
  const { isGatewayConnected } = useConnection();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("upi");
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const earningsData = {
    daily: { gross: "₹0", fee: "₹0", tolls: "₹0", net: "₹0", trips: 0 },
    weekly: { gross: "₹24,850", fee: "₹3,728", tolls: "₹1,200", net: "₹19,922", trips: 18 },
    monthly: { gross: "₹98,400", fee: "₹14,760", tolls: "₹4,800", net: "₹78,840", trips: 76 },
  };

  const current = earningsData[timeframe];

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Date,TransactionID,Trips,GrossFare,PlatformFee,FASTagTolls,NetPayout,Status\n" +
      "2026-10-10,TXN-BLR-9021,5,₹4850,₹728,₹300,₹3822,Settled\n" +
      "2026-10-09,TXN-BLR-8842,6,₹5750,₹862,₹300,₹4588,Settled\n" +
      "2026-10-08,TXN-BLR-8711,7,₹6900,₹1035,₹300,₹5565,Settled\n" +
      "2026-10-07,TXN-BLR-8540,4,₹3400,₹510,₹300,₹2590,Settled\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kootu_earnings_${timeframe}_inr_statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      setPayoutNotice("Please enter a valid withdrawal amount in ₹.");
      return;
    }
    setPayoutNotice(
      `Payout Request Blocked: The Indian banking gateway (/api/finance/payout) is currently disconnected. Cannot initiate ${payoutMethod === "upi" ? "UPI transfer" : "NEFT / IMPS transfer"} of ₹${payoutAmount} while in offline standby mode.`
    );
  };

  return (
    <AppShell title="Earnings & Payouts" subtitle="FINANCIAL WORKSPACE">
      {/* Timeframe & Action Bar */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                timeframe === t
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export Statement (CSV)</span>
          </button>
          <button
            onClick={() => {
              setPayoutNotice(null);
              setPayoutModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition"
          >
            Withdraw Funds (₹)
          </button>
        </div>
      </div>

      {/* 4 Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-500">Gross Fares</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
              {timeframe}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {current.gross}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              {current.trips} journeys completed
            </p>
          </div>
        </div>

        {/* Card 2: Platform Fee */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-500">Platform Services (15%)</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
              GST & Commission
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {current.fee}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              Dispatch & commercial insurance
            </p>
          </div>
        </div>

        {/* Card 3: Tolls & Surcharges */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-500">Airport FASTag Tolls</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
              Reimbursed
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {current.tolls}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              Terminal toll plaza refund
            </p>
          </div>
        </div>

        {/* Card 4: Net Payout */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-neutral-900/20 dark:border-white/20 shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-900 dark:text-white">Net Take-Home</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
              Settled
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {current.net}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              Available for bank withdrawal
            </p>
          </div>
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs">
        <h3 className="text-base font-extrabold text-neutral-900 dark:text-white mb-4">
          Settlement History (INR)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-neutral-500 uppercase tracking-wider border-b border-borderLight dark:border-borderLight-dark pb-2 font-bold">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">UTR Reference</th>
                <th className="py-3 px-3">Journeys</th>
                <th className="py-3 px-3">Gross Fare</th>
                <th className="py-3 px-3">Net Payout</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight dark:divide-borderLight-dark text-neutral-800 dark:text-neutral-200">
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                <td className="py-3.5 px-3">10 Oct 2026</td>
                <td className="py-3.5 px-3 font-mono">TXN-BLR-9021</td>
                <td className="py-3.5 px-3">5 trips</td>
                <td className="py-3.5 px-3 font-semibold">₹4,850</td>
                <td className="py-3.5 px-3 font-extrabold">₹3,822</td>
                <td className="py-3.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    Settled
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                <td className="py-3.5 px-3">09 Oct 2026</td>
                <td className="py-3.5 px-3 font-mono">TXN-BLR-8842</td>
                <td className="py-3.5 px-3">6 trips</td>
                <td className="py-3.5 px-3 font-semibold">₹5,750</td>
                <td className="py-3.5 px-3 font-extrabold">₹4,588</td>
                <td className="py-3.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    Settled
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                <td className="py-3.5 px-3">08 Oct 2026</td>
                <td className="py-3.5 px-3 font-mono">TXN-BLR-8711</td>
                <td className="py-3.5 px-3">7 trips</td>
                <td className="py-3.5 px-3 font-semibold">₹6,900</td>
                <td className="py-3.5 px-3 font-extrabold">₹5,565</td>
                <td className="py-3.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    Settled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-3xl shadow-2xl p-6 sm:p-8 text-neutral-900 dark:text-neutral-100 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setPayoutModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block">
                PAYOUT INITIATION
              </span>
              <h3 className="text-xl font-extrabold mt-0.5">Withdraw Earnings</h3>
              <p className="text-xs text-neutral-500 mt-1">Available balance: {current.net}</p>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("upi")}
                    className={`p-3 rounded-xl border text-xs text-left font-semibold transition ${
                      payoutMethod === "upi"
                        ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    Instant UPI (VPA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bank")}
                    className={`p-3 rounded-xl border text-xs text-left font-semibold transition ${
                      payoutMethod === "bank"
                        ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    NEFT / IMPS Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Amount (INR - ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="100"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 5000)"
                    className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              {payoutNotice && (
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300">
                  {payoutNotice}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition"
                >
                  Confirm Payout (₹)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
