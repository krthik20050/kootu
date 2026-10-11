"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "./context/NotificationContext";

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeNotifications();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeNotifications();
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
  }, [isOpen, closeNotifications]);

  if (!isOpen) return null;

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-16 right-10 sm:right-16 w-80 sm:w-96 bg-cardBg dark:bg-cardBg-dark border border-borderLight dark:border-borderLight-dark rounded-2xl shadow-xl z-50 overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-borderLight dark:border-borderLight-dark flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={closeNotifications}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
            aria-label="Close notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/40 border-b border-borderLight dark:border-borderLight-dark flex items-center space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
            filter === "all"
              ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
            filter === "unread"
              ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-borderLight dark:divide-borderLight-dark">
        {filtered.length === 0 ? (
          <div className="py-8 text-center px-4">
            <p className="text-xs font-medium text-neutral-400">No notifications found.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-3.5 flex items-start space-x-3 transition cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 ${
                !item.read ? "bg-neutral-100/50 dark:bg-neutral-900/30" : ""
              }`}
            >
              <div className="mt-0.5">
                {!item.read ? (
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white inline-block" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 inline-block" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold leading-tight truncate">{item.title}</h4>
                  <span className="text-[10px] text-neutral-400 ml-2 whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal line-clamp-2">
                  {item.description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotification(item.id);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded"
                title="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border-t border-borderLight dark:border-borderLight-dark flex justify-between items-center text-xs">
          <span className="text-[11px] text-neutral-400">Driver Alerts Queue</span>
          <button
            onClick={clearAll}
            className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
