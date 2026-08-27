"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { FactoryOverview, AssetTelemetry, ZoneSummary, AlertItem, TelemetryWebSocketMessage } from "@/lib/types";
import { fetchFactoryOverview, fetchAllAssets, fetchAllZones, fetchAlerts } from "@/lib/api";
import { MOCK_OVERVIEW, MOCK_ASSETS, MOCK_ZONES, MOCK_ALERTS } from "@/lib/mockFallback";

interface TelemetryContextType {
  overview: FactoryOverview;
  assets: AssetTelemetry[];
  zones: ZoneSummary[];
  alerts: AlertItem[];
  isConnected: boolean;
  acknowledgeAlertLocal: (alertId: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType>({
  overview: MOCK_OVERVIEW,
  assets: MOCK_ASSETS,
  zones: MOCK_ZONES,
  alerts: MOCK_ALERTS,
  isConnected: false,
  acknowledgeAlertLocal: () => {}
});

export const useTelemetry = () => useContext(TelemetryContext);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [overview, setOverview] = useState<FactoryOverview>(MOCK_OVERVIEW);
  const [assets, setAssets] = useState<AssetTelemetry[]>(MOCK_ASSETS);
  const [zones, setZones] = useState<ZoneSummary[]>(MOCK_ZONES);
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket("ws://localhost:8000/ws/telemetry");

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Retry connection in 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onmessage = (event) => {
          try {
            const data: TelemetryWebSocketMessage = JSON.parse(event.data);
            if (data.type === "FACTORY_TELEMETRY_UPDATE") {
              if (data.overview) setOverview(data.overview);
              if (data.assets && data.assets.length > 0) setAssets(data.assets);
              if (data.zones && data.zones.length > 0) setZones(data.zones);
              if (data.recent_alerts && data.recent_alerts.length > 0) setAlerts(data.recent_alerts);
            }
          } catch (e) {
            console.error("Error parsing WS telemetry:", e);
          }
        };
      } catch (e) {
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      }
    };

    // Initial fetch to populate state immediately
    const initialFetch = async () => {
      try {
        const [ov, as, zn, al] = await Promise.all([
          fetchFactoryOverview(),
          fetchAllAssets(),
          fetchAllZones(),
          fetchAlerts()
        ]);
        setOverview(ov);
        setAssets(as);
        setZones(zn);
        setAlerts(al);
      } catch (e) {
        console.error("Initial telemetry fetch error:", e);
      }
    };

    initialFetch();
    connectWebSocket();

    // Fallback polling if WS is offline
    pollInterval = setInterval(async () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
          const ov = await fetchFactoryOverview();
          setOverview(ov);
        } catch (e) {
          // ignore
        }
      }
    }, 5000);

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const acknowledgeAlertLocal = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, acknowledged: true, acknowledged_by: "[STATION-OP]" } : a))
    );
  };

  return (
    <TelemetryContext.Provider
      value={{
        overview,
        assets,
        zones,
        alerts,
        isConnected,
        acknowledgeAlertLocal
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}
