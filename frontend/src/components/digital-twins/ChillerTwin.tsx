"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface ChillerTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
}

export default function ChillerTwin({ asset, onComponentClick }: ChillerTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("chl01-comp");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `chl01-${idPrefix}`,
      name: idPrefix,
      component_type: "motor",
      status: "Healthy",
      health_score: 95,
      temperature: 50,
      vibration_rms: 0.5,
      failure_risk: 0.05,
      defect_type: null,
      hotspot: false
    } as ComponentTwinState);
  };

  const comp = getCompStatus("comp");
  const evap = getCompStatus("evap");
  const cond = getCompStatus("cond");

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
            Capacity: 500 TR (1750 kWth) • Chilled Water Supply: 6.2°C • Return: 12.4°C
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
          {/* Base Frame */}
          <rect x="60" y="340" width="780" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />

          {/* Semi-Hermetic Screw Compressor (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(comp as ComponentTwinState)}
          >
            <rect x="350" y="60" width="200" height="130" rx="10" fill="#1e293b" stroke={selectedCompId === comp.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="450" cy="125" r="40" fill="#0f172a" stroke="#64748b" />
            <text x="450" y="125" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SCREW COMPRESSOR</text>
            <text x="450" y="145" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">{asset.power_kw.toFixed(0)} kW • {asset.motor_current_a.toFixed(1)} A</text>
          </g>

          {/* Shell & Tube Evaporator (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(evap as ComponentTwinState)}
          >
            <rect x="100" y="210" width="280" height="110" rx="20" fill="#0f172a" stroke={selectedCompId === evap.id ? "#06b6d4" : "#0369a1"} strokeWidth="3" />
            <text x="240" y="260" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SHELL & TUBE EVAPORATOR</text>
            <text x="240" y="280" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">CHILLED WATER 6.2°C</text>
          </g>

          {/* Water-Cooled Condenser Unit (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(cond as ComponentTwinState)}
          >
            <rect x="520" y="210" width="280" height="110" rx="20" fill="#0f172a" stroke={selectedCompId === cond.id ? "#f59e0b" : "#b45309"} strokeWidth="3" />
            <text x="660" y="260" fill="#f59e0b" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CONDENSER BARREL</text>
            <text x="660" y="280" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">COOLING TOWER LOOP 32°C</text>
          </g>

          {/* Interconnecting Refrigerant Lines */}
          <path d="M 450 190 L 450 240 L 520 240" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="6,4" />
          <path d="M 380 260 L 410 260 L 410 160 L 350 160" fill="none" stroke="#06b6d4" strokeWidth="6" strokeDasharray="6,4" />

          {/* Flow Rate Overlay */}
          <g transform="translate(140, 90)">
            <rect x="0" y="0" width="140" height="32" rx="4" fill="#0b132b" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="70" y="14" fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle">CHILLED FLOW RATE</text>
            <text x="70" y="26" fill="#06b6d4" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.flow_rate_lpm.toFixed(1)} L/min
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
              <span className="text-slate-400 block text-[10px]">VIBRATION</span>
              <span className="text-slate-200 font-semibold">{selectedComp.vibration_rms} mm/s</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">FAILURE RISK</span>
              <span className="text-emerald-400 font-semibold">{(selectedComp.failure_risk * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">STATUS</span>
              <span className="text-emerald-400 font-semibold truncate block">Nominal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
