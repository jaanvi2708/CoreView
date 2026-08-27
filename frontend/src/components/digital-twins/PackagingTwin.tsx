"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface PackagingTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
}

export default function PackagingTwin({ asset, onComponentClick }: PackagingTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("wrp01-seal");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `wrp01-${idPrefix}`,
      name: idPrefix,
      component_type: "motor",
      status: "Healthy",
      health_score: 92,
      temperature: 40,
      vibration_rms: 0.5,
      failure_risk: 0.08,
      defect_type: null,
      hotspot: false
    } as ComponentTwinState);
  };

  const motor = getCompStatus("motor");
  const seal = getCompStatus("seal");
  const knife = getCompStatus("knife");
  const belt = getCompStatus("belt");

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
            Model: Bosch Packaging Sigpack HBM • Throughput: 350 packs/min • Sealing Temp: {asset.temperature_motor + 80}°C
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
          {/* Base Infeed Bed */}
          <rect x="50" y="320" width="800" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          
          {/* Infeed Conveyor Belt (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(belt as ComponentTwinState)}
          >
            <rect x="70" y="240" width="300" height="60" rx="6" fill="#334155" stroke={selectedCompId === belt.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            {[...Array(6)].map((_, i) => (
              <circle key={i} cx={90 + i * 50} cy="270" r="16" fill="#0f172a" stroke="#64748b" />
            ))}
            <text x="220" y="275" fill="#f8fafc" fontSize="12" fontFamily="monospace" textAnchor="middle">INFEED LUG CONVEYOR</text>
          </g>

          {/* Drive Motor (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(motor as ComponentTwinState)}
          >
            <rect x="90" y="120" width="140" height="100" rx="8" fill="#1e293b" stroke={selectedCompId === motor.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="210" cy="140" r="8" fill={getColor(motor.status)} />
            <text x="160" y="165" fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle">SERVO MOTOR</text>
            <text x="160" y="185" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">{asset.motor_current_a.toFixed(1)} A</text>
          </g>

          {/* Rotary Transverse & Longitudinal Heat Sealer (Clickable Hotspot) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(seal as ComponentTwinState)}
          >
            <rect
              x="420"
              y="160"
              width="150"
              height="150"
              rx="8"
              fill="#1e293b"
              stroke={selectedCompId === seal.id ? "#f59e0b" : "#475569"}
              strokeWidth={selectedCompId === seal.id ? "3" : "2"}
            />
            {seal.hotspot && (
              <circle cx="495" cy="235" r="45" fill="none" stroke="#f59e0b" strokeWidth="3" className="animate-defect-pulse" />
            )}
            <rect x="440" y="210" width="110" height="50" rx="4" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
            <text x="495" y="235" fill="#fef3c7" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              HEAT SEALER
            </text>
            <text x="495" y="250" fill="#fde68a" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {(asset.temperature_motor + 80).toFixed(0)} °C
            </text>
          </g>

          {/* Rotary Cutting Anvil / Flying Knife (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(knife as ComponentTwinState)}
          >
            <rect x="610" y="190" width="100" height="120" rx="6" fill="#1e293b" stroke={selectedCompId === knife.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="660" cy="245" r="28" fill="#334155" stroke="#94a3b8" />
            <line x1="640" y1="225" x2="680" y2="265" stroke="#ef4444" strokeWidth="3" />
            <text x="660" y="295" fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">ROTARY KNIFE</text>
          </g>

          {/* Discharge Outfeed */}
          <rect x="730" y="250" width="120" height="50" rx="4" fill="#334155" stroke="#475569" />
          <text x="790" y="280" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">DISCHARGE</text>

          {/* Leader Line Callout */}
          <g transform="translate(420, 60)">
            <line x1="75" y1="90" x2="75" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
            <rect x="0" y="0" width="160" height="34" rx="4" fill="#0b132b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="80" y="14" fill="#fde68a" fontSize="9" fontFamily="monospace" textAnchor="middle">SEAL PRESSURE DECAY</text>
            <text x="80" y="27" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.pressure_bar.toFixed(2)} bar (Δ{asset.pressure_diff_bar.toFixed(2)})
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
              Health Score: <strong className="text-slate-100">{selectedComp.health_score}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">OPERATING TEMP</span>
              <span className="text-slate-200 font-semibold">{selectedComp.temperature}°C</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VIBRATION RMS</span>
              <span className="text-slate-200 font-semibold">{selectedComp.vibration_rms} mm/s</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">FAILURE RISK</span>
              <span className="text-amber-400 font-semibold">{(selectedComp.failure_risk * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DIAGNOSED DEFECT</span>
              <span className="text-amber-400 font-semibold truncate block">
                {selectedComp.defect_type || "None (Nominal)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
