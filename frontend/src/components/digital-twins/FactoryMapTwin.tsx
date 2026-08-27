"use client";

import React, { useState } from "react";
import { ZoneSummary, AssetTelemetry } from "@/lib/types";
import { Layers } from "lucide-react";

interface FactoryMapTwinProps {
  zones: ZoneSummary[];
  assets: AssetTelemetry[];
  onZoneSelect?: (zoneId: string) => void;
  onAssetSelect?: (assetId: string) => void;
}

export default function FactoryMapTwin({ zones, assets, onZoneSelect, onAssetSelect }: FactoryMapTwinProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const getZoneColor = (status: string) => {
    if (status === "Critical") return "#da3633";
    if (status === "Warning") return "#d29922";
    return "#238636";
  };

  const getZoneHealth = (id: string) => {
    const z = zones.find(item => item.id === id);
    return z ? z.health_score : 95;
  };

  const getZoneStatus = (id: string) => {
    const z = zones.find(item => item.id === id);
    return z ? z.status : "Healthy";
  };

  return (
    <div className="scada-card p-4 flex flex-col gap-3 bg-[#161b22] border-[#30363d]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#58a6ff]" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
            Plant-Wide Digital Twin Layout (Smart Plant 04)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#8b949e]">
          5 Operational Zones • {assets.length} Supervised Assets
        </span>
      </div>

      <div className="relative bg-[#0d1117] border border-[#30363d] rounded-md p-2 overflow-hidden">
        <svg viewBox="0 0 1000 520" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Main Plant Boundary Wall */}
          <rect x="20" y="20" width="960" height="480" rx="6" fill="#161b22" stroke="#30363d" strokeWidth="2" />

          {/* Plant Floor Aisles */}
          <line x1="20" y1="260" x2="980" y2="260" stroke="#21262d" strokeWidth="6" strokeDasharray="12,6" />
          <line x1="500" y1="20" x2="500" y2="500" stroke="#21262d" strokeWidth="6" strokeDasharray="12,6" />

          {/* 1. Production & Machining Zone (Top Left) */}
          <g
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredZone("production")}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneSelect && onZoneSelect("production")}
          >
            <rect
              x="40"
              y="40"
              width="440"
              height="200"
              rx="4"
              fill={hoveredZone === "production" ? "#21262d" : "#0d1117"}
              stroke={getZoneColor(getZoneStatus("production"))}
              strokeWidth={hoveredZone === "production" ? "2" : "1.25"}
            />
            <text x="60" y="70" fill="#f0f6fc" fontSize="12" fontWeight="bold" fontFamily="monospace">
              [ZONE 01] PRODUCTION & MACHINING
            </text>
            <text x="60" y="90" fill="#8b949e" fontSize="10" fontFamily="monospace">
              OEE: 86.8% • Health: {getZoneHealth("production").toFixed(1)}%
            </text>

            {/* Asset Pips */}
            <g transform="translate(60, 110)">
              {/* CNC-01 */}
              <circle cx="40" cy="40" r="15" fill="#21262d" stroke="#da3633" strokeWidth="2" />
              <text x="40" y="44" fill="#f85149" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CNC1</text>
              <text x="40" y="70" fill="#f85149" fontSize="8" fontFamily="monospace" textAnchor="middle">CRIT</text>

              {/* CNC-02 */}
              <circle cx="120" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="120" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">CNC2</text>

              {/* PRS-01 */}
              <circle cx="200" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="200" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">PRS1</text>

              {/* ROB-01 */}
              <circle cx="280" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="280" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">ROB1</text>
            </g>
          </g>

          {/* 2. Packaging & Bottling Zone (Top Right) */}
          <g
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredZone("packaging")}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneSelect && onZoneSelect("packaging")}
          >
            <rect
              x="520"
              y="40"
              width="440"
              height="200"
              rx="4"
              fill={hoveredZone === "packaging" ? "#21262d" : "#0d1117"}
              stroke={getZoneColor(getZoneStatus("packaging"))}
              strokeWidth={hoveredZone === "packaging" ? "2" : "1.25"}
            />
            <text x="540" y="70" fill="#f0f6fc" fontSize="12" fontWeight="bold" fontFamily="monospace">
              [ZONE 02] PACKAGING & BOTTLING
            </text>
            <text x="540" y="90" fill="#8b949e" fontSize="10" fontFamily="monospace">
              OEE: 92.4% • Health: {getZoneHealth("packaging").toFixed(1)}%
            </text>

            <g transform="translate(540, 110)">
              {/* WRP-01 */}
              <circle cx="50" cy="40" r="15" fill="#21262d" stroke="#d29922" strokeWidth="2" />
              <text x="50" y="44" fill="#e3b341" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">WRP1</text>
              <text x="50" y="70" fill="#e3b341" fontSize="8" fontFamily="monospace" textAnchor="middle">WARN</text>

              {/* PLT-01 */}
              <circle cx="140" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="140" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">PLT1</text>

              {/* CRT-01 */}
              <circle cx="230" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="230" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">CRT1</text>
            </g>
          </g>

          {/* 3. Warehouse & Logistics (Bottom Left) */}
          <g
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredZone("warehouse")}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneSelect && onZoneSelect("warehouse")}
          >
            <rect
              x="40"
              y="280"
              width="440"
              height="200"
              rx="4"
              fill={hoveredZone === "warehouse" ? "#21262d" : "#0d1117"}
              stroke={getZoneColor(getZoneStatus("warehouse"))}
              strokeWidth={hoveredZone === "warehouse" ? "2" : "1.25"}
            />
            <text x="60" y="310" fill="#f0f6fc" fontSize="12" fontWeight="bold" fontFamily="monospace">
              [ZONE 03] WAREHOUSE & AS/RS
            </text>
            <text x="60" y="330" fill="#8b949e" fontSize="10" fontFamily="monospace">
              OEE: 94.2% • Health: {getZoneHealth("warehouse").toFixed(1)}%
            </text>

            <g transform="translate(60, 350)">
              {/* ASRS-01 */}
              <circle cx="40" cy="40" r="15" fill="#21262d" stroke="#d29922" strokeWidth="2" />
              <text x="40" y="44" fill="#e3b341" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ASR1</text>
              <text x="40" y="70" fill="#e3b341" fontSize="8" fontFamily="monospace" textAnchor="middle">WARN</text>

              {/* ASRS-02 */}
              <circle cx="120" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="120" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">ASR2</text>

              {/* CNV-01 */}
              <circle cx="200" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="200" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">CNV1</text>
            </g>
          </g>

          {/* 4. Utilities & Power (Bottom Right) */}
          <g
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredZone("utilities")}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneSelect && onZoneSelect("utilities")}
          >
            <rect
              x="520"
              y="280"
              width="440"
              height="200"
              rx="4"
              fill={hoveredZone === "utilities" ? "#21262d" : "#0d1117"}
              stroke={getZoneColor(getZoneStatus("utilities"))}
              strokeWidth={hoveredZone === "utilities" ? "2" : "1.25"}
            />
            <text x="540" y="310" fill="#f0f6fc" fontSize="12" fontWeight="bold" fontFamily="monospace">
              [ZONE 04] UTILITIES & POWER PLANT
            </text>
            <text x="540" y="330" fill="#8b949e" fontSize="10" fontFamily="monospace">
              OEE: 91.2% • Health: {getZoneHealth("utilities").toFixed(1)}%
            </text>

            <g transform="translate(540, 350)">
              {/* CMP-01 */}
              <circle cx="40" cy="40" r="15" fill="#21262d" stroke="#da3633" strokeWidth="2" />
              <text x="40" y="44" fill="#f85149" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CMP1</text>
              <text x="40" y="70" fill="#f85149" fontSize="8" fontFamily="monospace" textAnchor="middle">CRIT</text>

              {/* CMP-02 */}
              <circle cx="110" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="110" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">CMP2</text>

              {/* CHL-01 */}
              <circle cx="180" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="180" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">CHL1</text>

              {/* BLR-01 */}
              <circle cx="250" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="250" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">BLR1</text>

              {/* TX-01 */}
              <circle cx="320" cy="40" r="14" fill="#21262d" stroke="#238636" strokeWidth="1.5" />
              <text x="320" y="44" fill="#3fb950" fontSize="8" fontFamily="monospace" textAnchor="middle">TX01</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1 text-[#8b949e]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2ea043]" /> Normal</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#d29922]" /> Warning</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f85149]" /> Critical</span>
        </div>
        <span>Click any zone to open detailed view</span>
      </div>
    </div>
  );
}
