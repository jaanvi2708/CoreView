"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { overview, alerts, isConnected } = useTelemetry();
  const { isAuthenticated } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoginPage, router]);

  // On Login page, render full screen without any layout chrome
  if (isLoginPage) {
    return <main className="min-h-screen bg-[#0d1117]">{children}</main>;
  }

  // Not authenticated → loading screen until redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-xs font-mono text-[#8b949e]">
        Redirecting to Authentication Terminal…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      {/* Top Header Navigation Bar */}
      <Header
        overview={overview}
        isConnected={isConnected}
        alerts={alerts}
      />

      {/* Main Body: Left Thin Control Panel + Center Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          alerts={alerts}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        <main className="flex-1 overflow-y-auto bg-scada-grid p-4 lg:p-6 pb-16" style={{ background: '#0e1514' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
