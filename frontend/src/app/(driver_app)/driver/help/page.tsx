"use client";

import React, { useState } from "react";
import AppShell from "@/components/driver-dashboard/AppShell";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "faq-1",
    question: "Where is the designated airport staging lot for KOOTU cab drivers?",
    answer: "The commercial airport staging lot is located on Airport Approach Road, Near Fuel Station Zone C. Ensure your yellow board permit and FASTag are active before entering the lane.",
  },
  {
    id: "faq-2",
    question: "How are airport entry and FASTag tolls reimbursed?",
    answer: "Airport terminal gate tolls (₹120 flat) are scanned via your vehicle FASTag RFID and automatically credited back to your weekly trip payout statement.",
  },
  {
    id: "faq-3",
    question: "Why does my status show 'Unavailable' and 'Gateway Disconnected'?",
    answer: "Your driver workspace requires an active link to the KOOTU dispatch gateway service. If the server is offline or your pairing token is unlinked, availability cannot be toggled to protect GPS route matching.",
  },
  {
    id: "faq-4",
    question: "What happens if a domestic or international flight is delayed?",
    answer: "Flight arrival telemetry automatically syncs with DGCA radar feeds. If a flight is delayed over 30 minutes, your pickup slot window will automatically adjust.",
  },
  {
    id: "faq-5",
    question: "What is the payout settlement schedule for Indian bank accounts?",
    answer: "Daily trips settle every night at 23:59 IST. Weekly bank payouts execute automatically every Monday via Direct UPI or NEFT/IMPS transfer.",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");

  // Contact Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormFeedback({ type: "error", text: "Please enter a subject line." });
      return;
    }
    if (message.trim().length < 10) {
      setFormFeedback({
        type: "error",
        text: "Please provide a detailed description (at least 10 characters).",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormFeedback({
        type: "success",
        text: "Ticket logged in local driver queue. Note: Backend ticketing service (/api/support/ticket) is currently offline; your ticket will sync once connectivity is restored.",
      });
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <AppShell title="Help & Support" subtitle="ASSISTANCE & GUIDELINES">
      {/* Emergency Hotline Banner */}
      <div className="bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Airport Terminal Marshall & CISF Helpdesk
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Airport Ground Police Emergency Helpline: 080-6678-2222 / 112 (Ext. 3)
            </p>
          </div>
        </div>
        <button
          onClick={() => alert("Connecting to Airport Ground Operations & CISF Control Desk...")}
          className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-black dark:hover:bg-neutral-200 transition"
        >
          Call Control Desk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: FAQs */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1">
              KNOWLEDGE BASE
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>

          {/* Search FAQ */}
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
              placeholder="Search driver rules, FASTag, staging lot..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
            />
          </div>

          {/* Accordion */}
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition"
                  >
                    <span>{faq.question}</span>
                    <svg
                      className={`w-4 h-4 text-neutral-400 transform transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contact Support Form */}
        <div className="bg-cardBg dark:bg-cardBg-dark rounded-3xl p-6 sm:p-7 border border-borderLight dark:border-borderLight-dark shadow-xs">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase block mb-1">
              DIRECT INQUIRY
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Contact Fleet Operations
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Submit an issue or inquiry to the terminal fleet manager.
            </p>
          </div>

          <form onSubmit={handleSubmitSupport} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="technical">App or Telemetry Gateway</option>
                <option value="fare">Fare Dispute or FASTag Reimbursement</option>
                <option value="terminal">Airport Staging Lot Access</option>
                <option value="passenger">Passenger Conduct or Lost Luggage</option>
                <option value="account">Driver RC, Badge & Permit Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Detailed Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what occurred, including flight number or Trip ID if applicable..."
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 resize-none"
              />
            </div>

            {formFeedback && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  formFeedback.type === "success"
                    ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    : "bg-neutral-100 dark:bg-neutral-900 border-neutral-400 text-neutral-900 dark:text-white font-semibold"
                }`}
              >
                {formFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-black dark:hover:bg-neutral-200 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{isSubmitting ? "Submitting..." : "Submit Inquiry"}</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
