"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import { Lock, ShieldCheck } from "lucide-react";

interface ZoneSwitcherProps {
  currentZoneId?: string;
}

const ZONES_CONFIG = [
  { id: "production", code: "Z-01", name: "Production & Machining" },
  { id: "packaging", code: "Z-02", name: "Packaging & Bottling" },
  { id: "warehouse", code: "Z-03", name: "Warehouse & Logistics" },
  { id: "utilities", code: "Z-04", name: "Utilities & Power" },
  { id: "quality", code: "Z-05", name: "Quality Assurance" }
];

export default function ZoneSwitcher({ currentZoneId }: ZoneSwitcherProps) {
  const pathname = usePathname();
  const { zones, assets } = useTelemetry();
  const { role, roleInfo, canAccessZone } = useRole();

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-md p-1.5 flex flex-wrap items-center gap-1.5 shadow-sm">
      <div className="px-2.5 py-1 text-[11px] font-mono font-bold text-[#8b949e] uppercase tracking-wider border-r border-[#30363d] shrink-0 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#58a6ff]" />
        <span>Operational Zones</span>
      </div>

      <div className="flex flex-wrap items-center gap-1 flex-1">
        {ZONES_CONFIG.map(z => {
          const zoneData = zones.find(item => item.id === z.id);
          const zoneAssets = assets.filter(a => a.zone_id === z.id);
          const hasCritical = zoneAssets.some(a => a.health_state === "Critical");
          const hasWarning = zoneAssets.some(a => a.health_state === "Warning");
          
          const isActive = currentZoneId === z.id || pathname === `/zones/${z.id}`;
          const isAllowed = canAccessZone(z.id);
          const isUserAssignedZone = roleInfo.assignedZoneId === z.id;

          return (
            <Link
              key={z.id}
              href={`/zones/${z.id}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all btn-interactive ${
                isActive
                  ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold shadow-sm"
                  : isUserAssignedZone
                  ? "bg-[#21262d]/60 text-[#58a6ff] border border-[#388bfd]/50 hover:bg-[#21262d]"
                  : isAllowed
                  ? "bg-[#0d1117]/60 text-[#8b949e] border border-transparent hover:text-[#c9d1d9] hover:bg-[#21262d]/60 hover:border-[#30363d]"
                  : "bg-[#0d1117]/40 text-[#484f58] border border-transparent hover:text-[#8b949e] hover:bg-[#21262d]/30"
              }`}
              title={isAllowed ? undefined : `Requires authorization for ${z.name}`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasCritical
                    ? "bg-[#f85149]"
                    : hasWarning
                    ? "bg-[#d29922]"
                    : "bg-[#2ea043]"
                }`}
              />
              <span className="text-[10px] text-[#8b949e] font-bold">[{z.code}]</span>
              <span className="truncate">{z.name}</span>
              <span className="text-[10px] text-[#6e7681]">({zoneAssets.length || zoneData?.total_assets || 0})</span>
              {isUserAssignedZone && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/40">
                  ASSIGNED
                </span>
              )}
              {!isAllowed && <Lock className="w-2.5 h-2.5 text-[#484f58]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
