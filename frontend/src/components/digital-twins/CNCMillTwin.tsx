"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface CNCMillTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
}

export default function CNCMillTwin({ asset, onComponentClick }: CNCMillTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("cnc01-spindle");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `cnc01-${idPrefix}`,
      name: idPrefix,
      component_type: "spindle",
      status: "Healthy",
      health_score: 90,
      temperature: 45,
      vibration_rms: 0.4,
      failure_risk: 0.1,
      defect_type: null,
      hotspot: false
    } as ComponentTwinState);
  };

  const spindle = getCompStatus("spindle");
  const bearing = getCompStatus("bearing");
  const tooling = getCompStatus("tooling");
  const drives = getCompStatus("drives");
  const coolant = getCompStatus("coolant");

  const getColor = (status: string) => {
    if (status === "Critical") return "#ef4444";
    if (status === "Warning") return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="scada-card p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 led-cyan animate-pulse" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
              2D Digital Twin: {asset.name}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Model: DMG Mori DMU 85 monoBLOCK • Max Spindle: 20,000 RPM • Axes: 5 (X, Y, Z, B, C)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={asset.health_state} size="sm" pulse={asset.health_state !== "Healthy"} />
          <span className="text-[10px] font-mono text-slate-400">
            SYNC: {asset.last_updated.split(" ")[1] || "LIVE"}
          </span>
        </div>
      </div>

      <div className="relative bg-[#070d1a] border border-slate-800 rounded-lg p-2 overflow-hidden">
        <svg viewBox="0 0 900 440" className="w-full h-auto drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cnc-gantry" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="cnc-spindle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Machine Enclosure Outer Boundary */}
          <rect x="50" y="30" width="800" height="380" rx="10" fill="#0c1427" stroke="#1e293b" strokeWidth="3" />
          
          {/* Base Machine Bed */}
          <rect x="70" y="350" width="760" height="45" rx="4" fill="#1e293b" stroke="#334155" />
          <text x="450" y="380" fill="#64748b" fontSize="12" fontFamily="monospace" textAnchor="middle">
            MINERAL CAST MONOBLOCK BED
          </text>

          {/* Rotary Swivel Table (B & C Axes) */}
          <rect x="360" y="300" width="180" height="50" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />
          <circle cx="450" cy="300" r="45" fill="#475569" stroke="#64748b" />
          <text x="450" y="330" fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">ROTARY TABLE (C-AXIS)</text>

          {/* Vertical Gantry Column (Z-Axis) */}
          <rect x="370" y="60" width="160" height="150" fill="url(#cnc-gantry)" stroke="#475569" rx="4" />
          <line x1="390" y1="70" x2="390" y2="200" stroke="#0f172a" strokeWidth="4" />
          <line x1="510" y1="70" x2="510" y2="200" stroke="#0f172a" strokeWidth="4" />

          {/* Electro-Spindle Housing (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(spindle as ComponentTwinState)}
          >
            <rect
              x="410"
              y="140"
              width="80"
              height="120"
              rx="6"
              fill="url(#cnc-spindle)"
              stroke={selectedCompId === spindle.id ? "#ef4444" : "#475569"}
              strokeWidth={selectedCompId === spindle.id ? "3" : "1.5"}
            />
            {/* Spindle Defect Pulse if Hotspot */}
            {spindle.hotspot && (
              <circle cx="450" cy="200" r="35" fill="none" stroke="#ef4444" strokeWidth="3" className="animate-defect-pulse" />
            )}
            <circle cx="450" cy="200" r="16" fill="#1e293b" stroke={getColor(spindle.status)} strokeWidth="2" />
            <text x="450" y="204" fill="#fff" fontSize="8" fontFamily="monospace" textAnchor="middle">SPINDLE</text>

            {/* Tool Chuck & Endmill */}
            <polygon points="435,260 465,260 455,290 445,290" fill="#94a3b8" />
            <rect x="448" y="290" width="4" height="20" fill="#f59e0b" />
          </g>

          {/* Tool Changer Carousel Magazine (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(tooling as ComponentTwinState)}
          >
            <circle cx="170" cy="180" r="70" fill="#1e293b" stroke={selectedCompId === tooling.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="170" cy="180" r="25" fill="#0f172a" />
            {[...Array(8)].map((_, i) => {
              const ang = (i * 45 * Math.PI) / 180;
              return (
                <circle
                  key={i}
                  cx={170 + 45 * Math.cos(ang)}
                  cy={180 + 45 * Math.sin(ang)}
                  r="7"
                  fill="#64748b"
                  stroke="#94a3b8"
                />
              );
            })}
            <text x="170" y="270" fill="#cbd5e1" fontSize="11" fontFamily="monospace" textAnchor="middle">
              40-POCKET BT40 ATC
            </text>
          </g>

          {/* High-Pressure Coolant Unit (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(coolant as ComponentTwinState)}
          >
            <rect x="700" y="200" width="110" height="130" rx="4" fill="#1e293b" stroke="#475569" />
            <circle cx="755" cy="245" r="25" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            <text x="755" y="290" fill="#06b6d4" fontSize="10" fontFamily="monospace" textAnchor="middle">COOLANT PUMP</text>
            <text x="755" y="310" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">{asset.pressure_bar.toFixed(1)} bar</text>
          </g>

          {/* Telemetry Sensor Overlays */}
          {/* Spindle Vibration Callout */}
          <g transform="translate(490, 130)">
            <line x1="-10" y1="30" x2="40" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
            <rect x="40" y="-15" width="145" height="34" rx="4" fill="#0b132b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="112" y="-2" fill="#fca5a5" fontSize="9" fontFamily="monospace" textAnchor="middle">SPINDLE VIB (X-AXIS)</text>
            <text x="112" y="12" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.vibration_x.toFixed(2)} mm/s
            </text>
          </g>

          {/* Spindle Temperature Callout */}
          <g transform="translate(250, 100)">
            <rect x="0" y="0" width="130" height="32" rx="4" fill="#0b132b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="65" y="14" fill="#fde68a" fontSize="9" fontFamily="monospace" textAnchor="middle">BEARING TEMP</text>
            <text x="65" y="26" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.temperature_bearing.toFixed(1)} °C
            </text>
          </g>
        </svg>
      </div>

      {selectedComp && (
        <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-200">
                Selected Component: {selectedComp.name}
              </span>
              <StatusBadge status={selectedComp.status} size="sm" />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Component Health Score: <strong className="text-slate-100">{selectedComp.health_score}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TEMP RTD</span>
              <span className="text-slate-200 font-semibold">{selectedComp.temperature}°C</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VIBRATION RMS</span>
              <span className={selectedComp.vibration_rms > 2.0 ? "text-rose-400 font-semibold" : "text-slate-200 font-semibold"}>
                {selectedComp.vibration_rms} mm/s
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">FAILURE RISK</span>
              <span className="text-amber-400 font-semibold">{(selectedComp.failure_risk * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DIAGNOSED DEFECT</span>
              <span className="text-rose-400 font-semibold truncate block">
                {selectedComp.defect_type || "None (Nominal)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
