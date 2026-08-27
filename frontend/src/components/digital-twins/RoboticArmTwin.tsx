"use client";

import React, { useState } from "react";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";

interface RoboticArmTwinProps {
  asset: AssetTelemetry;
  onComponentClick?: (component: ComponentTwinState) => void;
}

export default function RoboticArmTwin({ asset, onComponentClick }: RoboticArmTwinProps) {
  const [selectedCompId, setSelectedCompId] = useState<string | null>("rob01-wrist");

  const components = asset.components || [];
  const selectedComp = components.find(c => c.id === selectedCompId) || components[0];

  const handleSelect = (comp: ComponentTwinState) => {
    setSelectedCompId(comp.id);
    if (onComponentClick) onComponentClick(comp);
  };

  const getCompStatus = (idPrefix: string): ComponentTwinState => {
    const c = components.find(item => item.id.includes(idPrefix));
    return c || ({
      id: `rob01-${idPrefix}`,
      name: idPrefix,
      component_type: "motor",
      status: "Healthy",
      health_score: 95,
      temperature: 45,
      vibration_rms: 0.25,
      failure_risk: 0.05,
      defect_type: null,
      hotspot: false
    } as ComponentTwinState);
  };

  const j1 = getCompStatus("j1");
  const j2 = getCompStatus("j2");
  const j3 = getCompStatus("j3");
  const wrist = getCompStatus("wrist");

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
            Model: KUKA KR 500 R2830 • Payload: 500 kg • Reach: 2,826 mm • Joint Kinematics: 6-DOF
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
          {/* Foundation Plate */}
          <rect x="100" y="360" width="300" height="35" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />

          {/* J1 Waist Pivot (Clickable) */}
          <g className="cursor-pointer" onClick={() => handleSelect(j1 as ComponentTwinState)}>
            <rect x="180" y="290" width="140" height="70" rx="8" fill="#334155" stroke={selectedCompId === j1.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="250" cy="325" r="22" fill="#0f172a" stroke="#64748b" />
            <text x="250" y="330" fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">J1 WAIST</text>
          </g>

          {/* J2 Shoulder Link (Clickable) */}
          <g className="cursor-pointer" onClick={() => handleSelect(j2 as ComponentTwinState)}>
            <path d="M 230 300 L 290 160 L 350 170 L 270 310 Z" fill="#1e293b" stroke={selectedCompId === j2.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <circle cx="250" cy="300" r="28" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="310" y="240" fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">J2 SHOULDER</text>
          </g>

          {/* J3 Elbow Arm & Servo (Clickable) */}
          <g className="cursor-pointer" onClick={() => handleSelect(j3 as ComponentTwinState)}>
            <circle cx="320" cy="165" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <path d="M 320 165 L 560 120 L 570 160 L 325 185 Z" fill="#334155" stroke={selectedCompId === j3.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            <text x="440" y="150" fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">J3 FOREARM LINK</text>
          </g>

          {/* J4/5/6 Wrist & Precision Gripper (Clickable) */}
          <g className="cursor-pointer" onClick={() => handleSelect(wrist as ComponentTwinState)}>
            <circle cx="580" cy="140" r="24" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <rect x="600" y="125" width="80" height="30" rx="4" fill="#1e293b" stroke={selectedCompId === wrist.id ? "#38bdf8" : "#475569"} strokeWidth="2" />
            {/* Gripper Fingers */}
            <polygon points="680,120 740,110 740,125 680,130" fill="#94a3b8" />
            <polygon points="680,150 740,165 740,150 680,145" fill="#94a3b8" />
            <text x="640" y="144" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">WRIST TOOL</text>
          </g>

          {/* Kinematic Leader Callout */}
          <g transform="translate(620, 40)">
            <rect x="0" y="0" width="160" height="34" rx="4" fill="#0b132b" stroke="#10b981" strokeWidth="1.5" />
            <text x="80" y="14" fill="#a7f3d0" fontSize="9" fontFamily="monospace" textAnchor="middle">REPEATABILITY</text>
            <text x="80" y="27" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ±0.04 mm (Nominal)
            </text>
          </g>
        </svg>
      </div>

      {selectedComp && (
        <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-200">
                Selected Joint: {selectedComp.name}
              </span>
              <StatusBadge status={selectedComp.status} size="sm" />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Joint Health Score: <strong className="text-slate-100">{selectedComp.health_score}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SERVO TEMP</span>
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
              <span className="text-slate-400 block text-[10px]">DIAGNOSIS</span>
              <span className="text-emerald-400 font-semibold truncate block">Nominal Kinematics</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
