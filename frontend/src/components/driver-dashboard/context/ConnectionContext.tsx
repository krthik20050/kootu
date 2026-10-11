"use client";

import React, { createContext, useContext, useState } from "react";

interface ConnectionContextType {
  isGatewayConnected: boolean;
  status: "unavailable" | "available";
  isChecking: boolean;
  lastChecked: Date | null;
  connectionError: string | null;
  diagnosticsOpen: boolean;
  openDiagnostics: () => void;
  closeDiagnostics: () => void;
  checkConnection: () => Promise<boolean>;
  toggleAvailability: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isGatewayConnected: false,
  status: "unavailable",
  isChecking: false,
  lastChecked: null,
  connectionError: null,
  diagnosticsOpen: false,
  openDiagnostics: () => {},
  closeDiagnostics: () => {},
  checkConnection: async () => false,
  toggleAvailability: () => {},
});

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isGatewayConnected, setIsGatewayConnected] = useState(false);
  const [status, setStatus] = useState<"unavailable" | "available">("unavailable");
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(
    "Dispatch gateway offline. Endpoint http://localhost:8000/api/health is unreachable."
  );
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const checkConnection = async (): Promise<boolean> => {
    setIsChecking(true);
    setConnectionError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("http://localhost:8000/api/health", {
        method: "GET",
        signal: controller.signal,
      }).catch(async () => {
        return await fetch("/api/health", { signal: controller.signal });
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        setIsGatewayConnected(true);
        setConnectionError(null);
        setLastChecked(new Date());
        setIsChecking(false);
        return true;
      } else {
        throw new Error("HTTP response error");
      }
    } catch {
      setIsGatewayConnected(false);
      setStatus("unavailable");
      setConnectionError(
        "Connection failed: KOOTU Dispatch Gateway service is not running or unreachable at port 8000. Backend driver endpoints (/api/driver/*) are offline."
      );
      setLastChecked(new Date());
      setIsChecking(false);
      return false;
    }
  };

  const openDiagnostics = () => setDiagnosticsOpen(true);
  const closeDiagnostics = () => setDiagnosticsOpen(false);

  const toggleAvailability = () => {
    if (!isGatewayConnected) {
      setDiagnosticsOpen(true);
    } else {
      setStatus((prev) => (prev === "available" ? "unavailable" : "available"));
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        isGatewayConnected,
        status,
        isChecking,
        lastChecked,
        connectionError,
        diagnosticsOpen,
        openDiagnostics,
        closeDiagnostics,
        checkConnection,
        toggleAvailability,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
