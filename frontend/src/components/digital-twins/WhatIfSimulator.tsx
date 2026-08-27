"use client";

import React, { useState, useEffect } from "react";
import { AssetTelemetry, WhatIfSimulationResponse } from "@/lib/types";
import { simulateWhatIf } from "@/lib/api";
import StatusBadge from "../common/StatusBadge";
import { Sliders, RotateCcw } from "lucide-react";

interface WhatIfSimulatorProps {
  asset: AssetTelemetry;
  onSimulationChange?: (result: WhatIfSimulationResponse) => void;
}

export default function WhatIfSimulator({ asset, onSimulationChange }: WhatIfSimulatorProps) {
  const [loadDelta, setLoadDelta] = useState<number>(0);
  const [rpmDelta, setRpmDelta] = useState<number>(0);
  const [tempDelta, setTempDelta] = useState<number>(0);
  const [lubeQuality, setLubeQuality] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<WhatIfSimulationResponse | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateWhatIf({
        asset_id: asset.id,
        load_pct_delta: loadDelta,
        rpm_delta: rpmDelta,
        ambient_temp_delta: tempDelta,
        lubrication_quality_pct: lubeQuality
      });
      setResult(res);
      if (onSimulationChange) onSimulationChange(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [asset.id, loadDelta, rpmDelta, tempDelta, lubeQuality]);

  const handleReset = () => {
    setLoadDelta(0);
    setRpmDelta(0);
    setTempDelta(0);
    setLubeQuality(100);
  };

  return (
    <div className="scada-card p-4 flex flex-col gap-4 bg-[#161b22] border-[#30363d]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#58a6ff]" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Digital Twin What-If Stress Simulator
            </h3>
          </div>
          <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
            Test operational parameter modifications and project physics-based degradation impact on {asset.name}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-mono border border-[#30363d] transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Baseline</span>
        </button>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0d1117] p-3.5 rounded border border-[#30363d]">
        {/* 1. Operating Load % */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8b949e]">OPERATING LOAD DELTA</span>
            <span className={`font-semibold ${loadDelta > 0 ? "text-[#f85149]" : loadDelta < 0 ? "text-[#3fb950]" : "text-[#c9d1d9]"}`}>
              {loadDelta > 0 ? `+${loadDelta}` : loadDelta}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={loadDelta}
            onChange={e => setLoadDelta(Number(e.target.value))}
            className="w-full accent-[#388bfd] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>-50% (Derate)</span>
            <span>0%</span>
            <span>+50% (Overload)</span>
          </div>
        </div>

        {/* 2. Speed / RPM Delta */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8b949e]">SPEED DELTA (RPM)</span>
            <span className={`font-semibold ${rpmDelta > 0 ? "text-[#f85149]" : rpmDelta < 0 ? "text-[#3fb950]" : "text-[#c9d1d9]"}`}>
              {rpmDelta > 0 ? `+${rpmDelta}` : rpmDelta} RPM
            </span>
          </div>
          <input
            type="range"
            min="-600"
            max="600"
            step="50"
            value={rpmDelta}
            onChange={e => setRpmDelta(Number(e.target.value))}
            className="w-full accent-[#58a6ff] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>-600 RPM</span>
            <span>0</span>
            <span>+600 RPM</span>
          </div>
        </div>

        {/* 3. Ambient / Coolant Temp Delta */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8b949e]">AMBIENT TEMP DELTA</span>
            <span className={`font-semibold ${tempDelta > 0 ? "text-[#f85149]" : tempDelta < 0 ? "text-[#3fb950]" : "text-[#c9d1d9]"}`}>
              {tempDelta > 0 ? `+${tempDelta}` : tempDelta} °C
            </span>
          </div>
          <input
            type="range"
            min="-15"
            max="25"
            step="1"
            value={tempDelta}
            onChange={e => setTempDelta(Number(e.target.value))}
            className="w-full accent-[#d29922] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>-15°C</span>
            <span>0°C</span>
            <span>+25°C</span>
          </div>
        </div>

        {/* 4. Lubrication Quality Index */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8b949e]">LUBRICATION INDEX</span>
            <span className={`font-semibold ${lubeQuality < 70 ? "text-[#f85149]" : lubeQuality < 90 ? "text-[#e3b341]" : "text-[#3fb950]"}`}>
              {lubeQuality}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={lubeQuality}
            onChange={e => setLubeQuality(Number(e.target.value))}
            className="w-full accent-[#238636] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>20% (Contaminated)</span>
            <span>60%</span>
            <span>100% (Clean)</span>
          </div>
        </div>
      </div>

      {/* Simulation Result Projection */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8b949e] uppercase">PROJECTED RUL CHANGE</span>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl font-mono-nums font-bold text-[#f0f6fc]">
                {result.simulated_rul_cycles} <span className="text-xs text-[#8b949e]">cycles</span>
              </span>
              <span className={`text-xs font-mono font-bold ${result.rul_delta_pct < 0 ? "text-[#f85149]" : "text-[#3fb950]"}`}>
                ({result.rul_delta_pct > 0 ? "+" : ""}{result.rul_delta_pct}%)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8b949e]">
              Baseline: {result.baseline_rul_cycles} cycles
            </span>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8b949e] uppercase">PROJECTED HEALTH INDEX</span>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl font-mono-nums font-bold text-[#f0f6fc]">
                {result.simulated_health_index.toFixed(1)} <span className="text-xs text-[#8b949e]">/ 100</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8b949e] truncate">
              {result.risk_level_delta}
            </span>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#8b949e] uppercase">THERMAL & VIBE DELTA</span>
            <div className="flex items-baseline gap-3 my-1">
              <span className="text-sm font-mono font-semibold text-[#e3b341]">
                +{result.projected_thermal_rise_c}°C Temp
              </span>
              <span className="text-sm font-mono font-semibold text-[#f85149]">
                +{result.projected_vibration_spike_pct}% Vibe
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8b949e] truncate">
              Failure Mode: {result.projected_failure_mode}
            </span>
          </div>
        </div>
      )}

      {result && (
        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-[#c9d1d9]">
          <strong className="text-[#58a6ff]">AI Prescriptive Assessment: </strong>
          {result.recommendation}
        </div>
      )}
    </div>
  );
}
