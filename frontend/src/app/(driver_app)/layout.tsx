import type { Metadata } from "next";
import { ThemeProvider } from "@/components/driver-dashboard/context/ThemeContext";
import { ConnectionProvider } from "@/components/driver-dashboard/context/ConnectionContext";
import { NotificationProvider } from "@/components/driver-dashboard/context/NotificationContext";

export const metadata: Metadata = {
  title: "KOOTU® - Driver Workspace",
  description: "Driver Workspace Overview for KOOTU",
};

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ConnectionProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
