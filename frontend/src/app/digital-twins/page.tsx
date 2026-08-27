"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import StatusBadge from "@/components/common/StatusBadge";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import ThreeDigitalTwinViewer from "@/components/digital-twins/ThreeDigitalTwinViewer";
import FactoryMapTwin from "@/components/digital-twins/FactoryMapTwin";
import WhatIfSimulator from "@/components/digital-twins/WhatIfSimulator";
import { Layers, Activity, Sliders, Box } from "lucide-react";

export default function DigitalTwinExplorerPage() {
  const { assets, zones } = useTelemetry();
  const { roleInfo } = useRole();
  const [selectedAssetId, setSelectedAssetId] = useState<string>("cmp-01");
  const [viewMode, setViewMode] = useState<"live" | "comparison" | "simulation" | "factory_map">("live");

  // If user is scoped to a zone, prioritize their zone assets
  const scopedAssets = assets.filter(a => {
    if (!roleInfo.assignedZoneId) return true;
    return a.zone_id === roleInfo.assignedZoneId;
  });

  const displayAssets = scopedAssets.length > 0 ? scopedAssets : assets;
  const selectedAsset = displayAssets.find(a => a.id === selectedAssetId) || displayAssets[0] || assets[0];

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher />

      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              3D WebGL Digital Twin Explorer
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-0.5">
            Interactive 3D Procedural CAD Models • Real-Time WebGL Telemetry Mesh Synchronization
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] p-1 rounded border border-[#30363d] text-xs font-mono">
          <button
            onClick={() => setViewMode("live")}
            className={`px-3 py-1.5 rounded transition-all btn-interactive ${
              viewMode === "live" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            3D Twin View
          </button>
          <button
            onClick={() => setViewMode("comparison")}
            className={`px-3 py-1.5 rounded transition-all btn-interactive ${
              viewMode === "comparison" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            State Comparison
          </button>
          <button
            onClick={() => setViewMode("simulation")}
            className={`px-3 py-1.5 rounded transition-all btn-interactive ${
              viewMode === "simulation" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            What-If Sandbox
          </button>
          <button
            onClick={() => setViewMode("factory_map")}
            className={`px-3 py-1.5 rounded transition-all btn-interactive ${
              viewMode === "factory_map" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            Plant Floor Map
          </button>
        </div>
      </div>

      {/* Asset Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {displayAssets.map(a => {
          const isSelected = a.id === selectedAssetId;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAssetId(a.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono shrink-0 transition-all btn-interactive ${
                isSelected
                  ? "bg-[#21262d] text-[#ffffff] border-[#388bfd] font-semibold shadow-sm"
                  : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-[#c9d1d9]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${a.health_state === "Critical" ? "bg-[#f85149]" : a.health_state === "Warning" ? "bg-[#d29922]" : "bg-[#2ea043]"}`} />
              <span>{a.id.toUpperCase()}: {a.name}</span>
            </button>
          );
        })}
      </div>

      {/* View Mode 1: Live Interactive 3D Twin */}
      {viewMode === "live" && selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ThreeDigitalTwinViewer asset={selectedAsset} />
          </div>

          <div className="space-y-4">
            <div className="scada-card p-4 bg-[#161b22]">
              <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase mb-2.5 border-b border-[#30363d] pb-2">
                Digital Twin Component Hierarchy
              </h3>
              <div className="space-y-2 font-mono text-xs max-h-[320px] overflow-y-auto pr-1">
                {selectedAsset.components.map(c => (
                  <div key={c.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex justify-between items-center">
                    <div>
                      <strong className="text-[#c9d1d9] block truncate">{c.name}</strong>
                      <span className="text-[10px] text-[#8b949e]">
                        {c.temperature}°C • {c.vibration_rms} mm/s • Risk: {(c.failure_risk * 100).toFixed(0)}%
                      </span>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="scada-card p-4 bg-[#161b22] border-[#30363d]">
              <h4 className="text-xs font-mono font-bold text-[#58a6ff] uppercase mb-2">
                3D CAD Node Telemetry
              </h4>
              <div className="space-y-1.5 text-xs font-mono text-[#c9d1d9]">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">OPC-UA Tag:</span>
                  <span className="text-[#c9d1d9]">ns=2;s={selectedAsset.id}.CAD3D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Frame Rate:</span>
                  <span className="text-[#3fb950]">60.0 FPS (WebGL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Network Latency:</span>
                  <span className="text-[#3fb950]">3.8 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: Side-by-Side Comparison (Current Live vs Degraded State) */}
      {viewMode === "comparison" && selectedAsset && (
        <div className="space-y-4">
          <div className="p-3 bg-[#21262d] border border-[#30363d] rounded-md text-xs font-mono text-[#c9d1d9]">
            <strong className="text-[#58a6ff]">State Comparison Matrix: </strong> Inspecting live active 3D twin vs projected 30-day degraded CAD wear state.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Current Live State */}
            <div className="scada-card p-4 border-[#30363d] bg-[#161b22]">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-3">
                <h3 className="text-xs font-mono font-bold text-[#f0f6fc] uppercase">
                  1. Current Live State
                </h3>
                <StatusBadge status={selectedAsset.health_state} size="sm" />
              </div>
              <ThreeDigitalTwinViewer asset={selectedAsset} />
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">RUL</span>
                  <span className="text-[#f0f6fc] font-bold">{selectedAsset.prediction.rul_cycles} cyc</span>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">HEALTH</span>
                  <span className="text-[#f0f6fc] font-bold">{selectedAsset.prediction.health_index.toFixed(1)}%</span>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">VIB RMS</span>
                  <span className="text-[#f0f6fc] font-bold">{selectedAsset.vibration_x.toFixed(2)} mm/s</span>
                </div>
              </div>
            </div>

            {/* Right: Projected Degraded State */}
            <div className="scada-card p-4 border-[#da3633]/40 bg-[#161b22]">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-3">
                <h3 className="text-xs font-mono font-bold text-[#f85149] uppercase">
                  2. Projected 30-Day Degraded State
                </h3>
                <StatusBadge status="Critical" size="sm" pulse={true} />
              </div>
              <ThreeDigitalTwinViewer asset={{
                ...selectedAsset,
                vibration_x: selectedAsset.vibration_x * 1.65,
                temperature_bearing: selectedAsset.temperature_bearing + 18.0,
                health_state: "Critical"
              }} />
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">PROJECTED RUL</span>
                  <span className="text-[#f85149] font-bold">0 cycles</span>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">PROJECTED HEALTH</span>
                  <span className="text-[#f85149] font-bold">12.5%</span>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">PROJECTED VIB</span>
                  <span className="text-[#f85149] font-bold">{(selectedAsset.vibration_x * 1.65).toFixed(2)} mm/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 3: What-If Sandbox */}
      {viewMode === "simulation" && selectedAsset && (
        <WhatIfSimulator asset={selectedAsset} />
      )}

      {/* View Mode 4: Plant Floor Twin */}
      {viewMode === "factory_map" && (
        <FactoryMapTwin zones={zones} assets={assets} />
      )}
    </div>
  );
}
