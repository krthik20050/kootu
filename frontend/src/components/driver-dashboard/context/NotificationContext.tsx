"use client";

import React, { createContext, useContext, useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "system" | "warning" | "info";
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Gateway Standby Mode",
    description: "Driver dashboard is disconnected from the live dispatch server. Telemetry is currently paused.",
    timestamp: "10 mins ago",
    read: false,
    type: "warning",
  },
  {
    id: "notif-2",
    title: "FASTag Toll & Permit Reminder",
    description: "Airport Commercial Entry Decal is active. Ensure minimum ₹200 FASTag balance for terminal toll gates.",
    timestamp: "2 hours ago",
    read: false,
    type: "info",
  },
  {
    id: "notif-3",
    title: "Workspace Initialized",
    description: "Welcome to KOOTU® Driver Workspace. Review your profile and airport access credentials.",
    timestamp: "1 day ago",
    read: true,
    type: "system",
  },
];

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  openNotifications: () => {},
  closeNotifications: () => {},
  toggleNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotification: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);
  const toggleNotifications = () => setIsOpen((prev) => !prev);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        openNotifications,
        closeNotifications,
        toggleNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
