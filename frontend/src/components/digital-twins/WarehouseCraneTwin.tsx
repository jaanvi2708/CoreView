"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface WarehouseCraneTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
}

export default function WarehouseCraneTwin({ asset, onComponentClick }: WarehouseCraneTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("asrs01-travel");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `asrs01-${idPrefix}`,
      name: idPrefix,
      component_type: "motor",
      status: "Healthy",
      health_score: 92,
      temperature: 45,
      vibration_rms: 0.5,
      failure_risk: 0.08,
      defect_type: null,
      hotspot: false
    } as ComponentTwinState);
  };

  const travel = getCompStatus("travel");
  const hoist = getCompStatus("hoist");
  const fork = getCompStatus("fork");

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
            Height: 32m High-Bay • Travel Speed: 240 m/min • Hoist Speed: 90 m/min
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
          {/* Warehouse High-Bay Racking Background */}
          {[...Array(6)].map((_, col) => (
            <g key={col} opacity="0.3">
              <line x1={80 + col * 140} y1="30" x2={80 + col * 140} y2="380" stroke="#334155" strokeWidth="2" />
              {[...Array(6)].map((_, row) => (
                <rect key={row} x={90 + col * 140} y={40 + row * 55} width="110" height="45" fill="#1e293b" stroke="#334155" />
              ))}
            </g>
          ))}

          {/* Floor Rail */}
          <rect x="50" y="380" width="800" height="20" fill="#334155" stroke="#475569" />
          <line x1="50" y1="390" x2="850" y2="390" stroke="#94a3b8" strokeWidth="2" />

          {/* AS/RS Crane Vertical Mast */}
          <g transform="translate(420, 0)">
            {/* Mast Column */}
            <rect x="0" y="30" width="40" height="350" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="20" y1="30" x2="20" y2="380" stroke="#0f172a" strokeWidth="3" />
            
            {/* Top Guide Trolley */}
            <rect x="-10" y="20" width="60" height="20" fill="#334155" rx="2" />

            {/* Travel Bottom Bogie & Motor (Clickable Hotspot) */}
            <g className="cursor-pointer" onClick={() => handleSelect(travel as ComponentTwinState)}>
              <rect x="-40" y="350" width="120" height="35" rx="4" fill="#1e293b" stroke={selectedCompId === travel.id ? "#f59e0b" : "#475569"} strokeWidth="2" />
              {travel.hotspot && (
                <circle cx="20" cy="365" r="30" fill="none" stroke="#f59e0b" strokeWidth="2" className="animate-defect-pulse" />
              )}
              <circle cx="-15" cy="375" r="12" fill="#0f172a" stroke="#94a3b8" />
              <circle cx="55" cy="375" r="12" fill="#0f172a" stroke="#94a3b8" />
              <circle cx="20" cy="365" r="6" fill={getColor(travel.status)} />
              <text x="20" y="340" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">TRAVEL BOGIE</text>
            </g>

            {/* Vertical Lift Carriage & Hoist (Clickable) */}
            <g className="cursor-pointer" onClick={() => handleSelect(hoist as ComponentTwinState)}>
              <rect x="-30" y="160" width="100" height="60" rx="4" fill="#334155" stroke={selectedCompId === hoist.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
              <circle cx="20" cy="180" r="14" fill="#0f172a" stroke="#64748b" />
              <text x="20" y="210" fill="#f8fafc" fontSize="9" fontFamily="monospace" textAnchor="middle">HOIST CARRIAGE</text>
            </g>

            {/* Telescopic Shuttle Forks (Clickable) */}
            <g className="cursor-pointer" onClick={() => handleSelect(fork as ComponentTwinState)}>
              <rect x="70" y="180" width="90" height="15" fill="#f59e0b" stroke="#b45309" rx="2" />
              <polygon points="160,180 180,187 160,195" fill="#f59e0b" />
              <text x="120" y="172" fill="#fde68a" fontSize="8" fontFamily="monospace" textAnchor="middle">SHUTTLE FORK</text>
            </g>
          </g>

          {/* Travel Vibration Leader Callout */}
          <g transform="translate(540, 310)">
            <line x1="-70" y1="40" x2="-20" y2="0" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
            <rect x="0" y="-15" width="150" height="34" rx="4" fill="#0b132b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="75" y="-2" fill="#fde68a" fontSize="9" fontFamily="monospace" textAnchor="middle">TRAVEL RAIL VIBRATION</text>
            <text x="75" y="12" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.vibration_x.toFixed(2)} mm/s
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
              <span className="text-slate-400 block text-[10px]">TEMP</span>
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
