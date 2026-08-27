"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertItem } from "@/lib/types";
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  ShieldAlert, 
  FileSpreadsheet, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  alerts?: AlertItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ alerts = [], isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const unackAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === "CRITICAL" && !a.acknowledged).length;

  const navItems = [
    { label: "Main Control Room", href: "/", icon: LayoutDashboard, badge: null },
    { label: "3D Digital Twins", href: "/digital-twins", icon: Layers, badge: "3D" },
    { label: "AI Command Center", href: "/ai-command", icon: Cpu, badge: "ACTIVE" },
    { label: "Alerts & Work Orders", href: "/alerts-work-orders", icon: ShieldAlert, badge: unackAlertsCount > 0 ? `${unackAlertsCount}` : null, isAlert: criticalCount > 0 },
    { label: "Reports & Analytics", href: "/reports", icon: FileSpreadsheet, badge: null },
    { label: "Settings & Config", href: "/settings", icon: Settings, badge: null },
  ];

  return (
    <aside
      className={`bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between shrink-0 min-h-[calc(100vh-50px)] transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="p-3 space-y-4">
        {/* Collapse / Expand Toggle Button */}
        {onToggle && (
          <div className="flex justify-end pb-1 border-b border-[#30363d]/60">
            <button
              onClick={onToggle}
              className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors btn-interactive"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Primary Control Room Nav */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold tracking-widest text-[#8b949e] uppercase px-2 mb-2">
              Operations & Control
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"} rounded text-xs font-mono transition-all btn-interactive ${
                    active
                      ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold shadow-sm"
                      : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/70"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#58a6ff]" : "text-[#8b949e]"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        item.isAlert
                          ? "bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40 animate-pulse"
                          : "bg-[#21262d] text-[#8b949e] border border-[#30363d]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / System Status Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117] text-[10px] font-mono text-[#8b949e] space-y-1">
          <div className="flex justify-between">
            <span>3D WebGL Engine</span>
            <span className="text-[#3fb950] font-semibold">THREE.JS 60FPS</span>
          </div>
          <div className="flex justify-between">
            <span>ISO 13374 Diagnostic</span>
            <span className="text-[#58a6ff]">COMPLIANT</span>
          </div>
        </div>
      )}
    </aside>
  );
}
