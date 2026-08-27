"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface CompressorTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
  interactive?: boolean;
}

export default function CompressorTwin({ asset, onComponentClick, interactive = true }: CompressorTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("cmp01-drive-brg");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `cmp01-${idPrefix}`,
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

  const motor = getCompStatus("motor");
  const brg = getCompStatus("brg");
  const volute = getCompStatus("volute");
  const shaft = getCompStatus("shaft");
  const valves = getCompStatus("valves");

  // Health color mapping
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
            Model: Ingersoll Rand Centac C800 • Power: {asset.power_kw} kW • Speed: {asset.rpm.toFixed(0)} RPM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={asset.health_state} size="sm" pulse={asset.health_state !== "Healthy"} />
          <span className="text-[10px] font-mono text-slate-400">
            SYNC: {asset.last_updated.split(" ")[1] || "LIVE"}
          </span>
        </div>
      </div>

      {/* SVG Vector Technical Schematic */}
      <div className="relative bg-[#070d1a] border border-slate-800 rounded-lg p-2 overflow-hidden">
        <svg viewBox="0 0 900 440" className="w-full h-auto drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="c-metal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="c-pipe" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="c-glow-crit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.2" />
            </linearGradient>
            <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1e293b" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect x="0" y="0" width="900" height="440" fill="url(#grid-dots)" />

          {/* Heavy Machine Cast Bedplate */}
          <rect x="40" y="340" width="820" height="45" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <line x1="40" y1="365" x2="860" y2="365" stroke="#0f172a" strokeWidth="3" />
          {[...Array(10)].map((_, i) => (
            <rect key={i} x={60 + i * 80} y="385" width="20" height="8" fill="#0f172a" rx="1" />
          ))}

          {/* 1. Main Induction Motor (Clickable) */}
          <g
            className={`cursor-pointer transition-all duration-200 ${selectedCompId === motor.id ? "opacity-100" : "hover:opacity-90"}`}
            onClick={() => handleSelect(motor as ComponentTwinState)}
          >
            <rect
              x="70"
              y="130"
              width="280"
              height="210"
              rx="12"
              fill="url(#c-metal)"
              stroke={selectedCompId === motor.id ? "#38bdf8" : "#475569"}
              strokeWidth={selectedCompId === motor.id ? "3" : "1.5"}
            />
            {/* Motor Cooling Ribs */}
            {[...Array(10)].map((_, i) => (
              <line key={i} x1="90" y1={150 + i * 18} x2="330" y2={150 + i * 18} stroke="#0b1329" strokeWidth="5" />
            ))}
            {/* Terminal Box */}
            <rect x="160" y="90" width="100" height="40" rx="4" fill="#334155" stroke="#475569" />
            <text x="210" y="115" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">480V / 250kW</text>
            
            {/* Motor Label */}
            <text x="210" y="245" fill="#f8fafc" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              MAIN DRIVE MOTOR
            </text>
            <text x="210" y="265" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              {asset.motor_current_a.toFixed(1)} A • {asset.temperature_motor.toFixed(1)}°C
            </text>
            
            {/* Status LED */}
            <circle cx="320" cy="155" r="8" fill={getColor(motor.status)} />
          </g>

          {/* 2. Drive Shaft & Coupling (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(shaft as ComponentTwinState)}
          >
            <rect
              x="350"
              y="205"
              width="90"
              height="50"
              fill="url(#c-pipe)"
              stroke={selectedCompId === shaft.id ? "#38bdf8" : "#475569"}
              strokeWidth="2"
            />
            <line x1="395" y1="195" x2="395" y2="265" stroke="#94a3b8" strokeWidth="4" />
            <text x="395" y="235" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle">COUPLING</text>
          </g>

          {/* 3. Drive-End Bearing Housing (Clickable Hotspot) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(brg as ComponentTwinState)}
          >
            <rect
              x="420"
              y="180"
              width="50"
              height="100"
              rx="6"
              fill="#1e293b"
              stroke={selectedCompId === brg.id ? "#ef4444" : "#475569"}
              strokeWidth={selectedCompId === brg.id ? "3" : "1.5"}
            />
            {/* Bearing Defect Pulse Glow */}
            {brg.hotspot && (
              <circle cx="445" cy="230" r="38" fill="none" stroke="#ef4444" strokeWidth="3" className="animate-defect-pulse" />
            )}
            <circle cx="445" cy="230" r="18" fill="#334155" stroke={getColor(brg.status)} strokeWidth="2" />
            <text x="445" y="234" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">BRG</text>
          </g>

          {/* 4. Compressor Volute / Impeller Housing (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(volute as ComponentTwinState)}
          >
            {/* Outer Volute */}
            <circle
              cx="590"
              cy="230"
              r="115"
              fill="url(#c-metal)"
              stroke={selectedCompId === volute.id ? "#38bdf8" : "#475569"}
              strokeWidth={selectedCompId === volute.id ? "3" : "2"}
            />
            <circle cx="590" cy="230" r="70" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            
            {/* Impeller Blades Animation */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
              <line
                key={idx}
                x1="590"
                y1="230"
                x2={590 + 55 * Math.cos((angle * Math.PI) / 180)}
                y2={230 + 55 * Math.sin((angle * Math.PI) / 180)}
                stroke="#64748b"
                strokeWidth="3"
              />
            ))}

            <text x="590" y="225" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              CENTRIFUGAL VOLUTE
            </text>
            <text x="590" y="245" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              {asset.pressure_bar.toFixed(2)} bar • {asset.acoustic_emission_db.toFixed(1)} dB
            </text>
          </g>

          {/* 5. Discharge Pipe & Unloader Valves (Clickable) */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelect(valves as ComponentTwinState)}
          >
            <path
              d="M 590 115 L 590 35 L 810 35 L 810 75 L 635 75 L 635 115 Z"
              fill="url(#c-pipe)"
              stroke={selectedCompId === valves.id ? "#38bdf8" : "#475569"}
              strokeWidth="2"
            />
            {/* Valve Actuator Box */}
            <rect x="700" y="15" width="60" height="40" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="730" y="38" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">UNLOADER</text>
          </g>

          {/* 6. Suction Line */}
          <path d="M 705 230 L 840 230 L 840 270 L 705 270 Z" fill="url(#c-pipe)" stroke="#475569" strokeWidth="2" />
          <text x="770" y="255" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">INLET AIR</text>

          {/* Live Sensor Overlay Callouts with Leader Lines */}
          {/* Temperature Sensor Callout */}
          <g transform="translate(140, 30)">
            <line x1="80" y1="80" x2="30" y2="20" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
            <rect x="-30" y="0" width="130" height="32" rx="4" fill="#0b132b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="35" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">MOTOR RTD TEMP</text>
            <text x="35" y="26" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.temperature_motor.toFixed(1)} °C
            </text>
          </g>

          {/* Bearing Vibration Callout */}
          <g transform="translate(420, 320)">
            <line x1="25" y1="-90" x2="80" y2="-20" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
            <rect x="30" y="-20" width="150" height="36" rx="4" fill="#0b132b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="105" y="-6" fill="#fca5a5" fontSize="9" fontFamily="monospace" textAnchor="middle">BRG VIBRATION (RMS)</text>
            <text x="105" y="8" fill="#ef4444" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.vibration_x.toFixed(2)} mm/s
            </text>
          </g>

          {/* Discharge Pressure Callout */}
          <g transform="translate(730, 95)">
            <rect x="-10" y="0" width="130" height="32" rx="4" fill="#0b132b" stroke="#10b981" strokeWidth="1.5" />
            <text x="55" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">DISCHARGE PRESS.</text>
            <text x="55" y="26" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {asset.pressure_bar.toFixed(2)} bar
            </text>
          </g>
        </svg>
      </div>

      {/* Component Telemetry Inspector Flyout */}
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
              <span className="text-slate-400 block text-[10px]">SURFACE TEMP</span>
              <span className="text-slate-200 font-semibold">{selectedComp.temperature}°C</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VIBRATION RMS</span>
              <span className={selectedComp.vibration_rms > 2.5 ? "text-rose-400 font-semibold" : "text-slate-200 font-semibold"}>
                {selectedComp.vibration_rms} mm/s
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">FAILURE PROBABILITY</span>
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
