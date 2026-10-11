"use client";

import React from "react";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  rightBadge: React.ReactNode;
  note: string;
}

function MetricCard({ title, href, icon, rightBadge, note }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="group bg-cardBg dark:bg-cardBg-dark rounded-2xl p-5 border border-borderLight dark:border-borderLight-dark shadow-xs flex flex-col justify-between h-40 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-105 transition-transform font-bold text-sm">
            {icon}
          </div>
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </span>
        </div>
        <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
          {rightBadge}
        </div>
      </div>
      <div>
        <div className="w-6 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full mb-3" />
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
          <span>
            <span className="mr-1">—</span> {note}
          </span>
          <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
      </div>
    </Link>
  );
}

export default function MetricsGrid() {
  const metrics = [
    {
      title: "Today's earnings",
      href: "/driver/earnings",
      icon: <span>₹</span>,
      rightBadge: <span className="text-xs text-neutral-800 dark:text-neutral-200 font-semibold">₹</span>,
      note: "Settles after completed trips",
    },
    {
      title: "Completed rides",
      href: "/driver/my-trips",
      icon: (
        <svg
          className="w-4 h-4 text-neutral-800 dark:text-neutral-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M3.05 11a9 9 0 1 1 .5 4M3 5v6h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      rightBadge: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M3.05 11a9 9 0 1 1 .5 4M3 5v6h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      note: "Completed journeys will appear here",
    },
    {
      title: "Ride requests",
      href: "/driver/ride-requests",
      icon: (
        <svg
          className="w-4 h-4 text-neutral-800 dark:text-neutral-200"
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
      rightBadge: (
        <svg
          className="w-3.5 h-3.5"
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
      note: "Opportunities will appear when connected",
    },
    {
      title: "Online duration",
      href: "/driver/ride-history",
      icon: (
        <svg
          className="w-4 h-4 text-neutral-800 dark:text-neutral-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      rightBadge: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      note: "Driving time will appear when connected",
    },
  ];

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-purpose="metrics-grid"
    >
      {metrics.map((metric, idx) => (
        <MetricCard
          key={idx}
          title={metric.title}
          href={metric.href}
          icon={metric.icon}
          rightBadge={metric.rightBadge}
          note={metric.note}
        />
      ))}
    </section>
  );
}
