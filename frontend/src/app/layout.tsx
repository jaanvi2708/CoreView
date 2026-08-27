import type { Metadata } from "next";
import "./globals.css";
import { TelemetryProvider } from "@/context/TelemetryContext";
import { RoleProvider } from "@/context/RoleContext";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "CoreView – Enterprise SCADA & Predictive Maintenance Platform",
  description: "24/7 Smart Factory Operational Control Panel, Interactive Digital Twins, and AI Predictive Maintenance System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" style={{ background: '#0e1514', color: '#dde4e2' }}>
      <body className="h-full overflow-x-hidden flex flex-col" style={{ background: '#0e1514', color: '#dde4e2' }}>
        <RoleProvider>
          <TelemetryProvider>
            <AppShell>{children}</AppShell>
          </TelemetryProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
