"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import MetricCard from "@/components/common/MetricCard";
import StatusBadge from "@/components/common/StatusBadge";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import ThreeDigitalTwinViewer from "@/components/digital-twins/ThreeDigitalTwinViewer";
import WhatIfSimulator from "@/components/digital-twins/WhatIfSimulator";
import OscilloscopeChart from "@/components/common/OscilloscopeChart";
import { fetchAssetHistory, createWorkOrder } from "@/lib/api";
import { Wrench, CheckCircle2, Lock, ArrowLeft, Activity, ShieldAlert } from "lucide-react";

export default function AssetDeepDivePage() {
  const params = useParams();
  const assetId = (params.assetId as string) || "cmp-01";
  const { assets } = useTelemetry();
  const { role, roleInfo, hasPermission, canAccessZone, setRole } = useRole();

  const asset = assets.find(a => a.id === assetId) || assets[0];
  const [historyData, setHistoryData] = useState<any>(null);
  const [woCreatedNotice, setWoCreatedNotice] = useState<string | null>(null);

  const isAuthorized = canAccessZone(asset.zone_id);
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchAssetHistory(assetId).then(data => setHistoryData(data));
  }, [assetId]);

  const handleCreateWorkOrder = async () => {
    if (!hasPermission("canDispatchWorkOrders")) {
      setWoCreatedNotice("Requires Supervisor clearance to create work orders.");
      setTimeout(() => setWoCreatedNotice(null), 3500);
      return;
    }

    const wo = await createWorkOrder({
      asset_id: asset.id,
      asset_name: asset.name,
      zone_id: asset.zone_id,
      zone_name: asset.zone_name,
      priority: asset.health_state === "Critical" ? "P1 - Emergency" : "P2 - High",
      title: `Corrective Maintenance: ${asset.prediction.failure_mode}`,
      prescriptive_procedure: asset.prediction.prescriptive_action,
      required_parts: asset.prediction.required_parts,
      estimated_hours: asset.prediction.estimated_wrench_time_hrs,
      estimated_cost_usd: asset.prediction.downtime_cost_risk_usd * 0.1
    });
    setWoCreatedNotice(`Created Work Order ${wo.id}`);
    setTimeout(() => setWoCreatedNotice(null), 4000);
  };

  // If user is restricted by Zone-Scoped RBAC
  if (!isAuthorized) {
    return (
      <div className="space-y-5">
        <ZoneSwitcher currentZoneId={asset.zone_id} />

        <div className="scada-card p-8 bg-[#161b22] border-[#30363d] text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-[#d29922]/15 border border-[#d29922]/40 text-[#e3b341] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase">
              Machine Telemetry Restricted
            </h2>
            <p className="text-xs text-[#8b949e] font-mono mt-1 leading-relaxed">
              This asset (<strong className="text-[#c9d1d9]">{asset.name}</strong>) is located in <strong className="text-[#58a6ff]">{asset.zone_name}</strong>. Your station (<strong className="text-[#c9d1d9]">{roleInfo.userName}</strong>) is scoped to <strong className="text-[#58a6ff]">{roleInfo.assignedZoneName}</strong>.
            </p>
          </div>

          <div className="pt-3 border-t border-[#30363d] flex justify-center gap-3">
            {roleInfo.assignedZoneId && (
              <Link
                href={`/zones/${roleInfo.assignedZoneId}`}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-mono font-semibold transition-colors btn-interactive"
              >
                Go to My Assigned Zone →
              </Link>
            )}
            <button
              onClick={() => setRole("admin")}
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono transition-colors btn-interactive"
            >
              Elevate to System Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Ribbon */}
      <ZoneSwitcher currentZoneId={asset.zone_id} />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e] mb-1">
            <Link href="/" className="hover:text-[#c9d1d9] btn-interactive">Control Panel</Link>
            <span>/</span>
            <Link href={`/zones/${asset.zone_id}`} className="hover:text-[#c9d1d9] btn-interactive">{asset.zone_name}</Link>
            <span>/</span>
            <span className="text-[#f0f6fc] font-semibold">{asset.id.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              {asset.name}
            </h2>
            <StatusBadge status={asset.health_state} size="md" pulse={asset.health_state !== "Healthy"} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {woCreatedNotice && (
            <span className="text-xs font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-3 py-1.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {woCreatedNotice}
            </span>
          )}
          <button
            onClick={handleCreateWorkOrder}
            className={`px-4 py-2 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-2 btn-interactive ${
              hasPermission("canDispatchWorkOrders")
                ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
                : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
            }`}
            title={hasPermission("canDispatchWorkOrders") ? "Create Work Order" : "Requires Supervisor clearance"}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Create Work Order</span>
            {!hasPermission("canDispatchWorkOrders") && <Lock className="w-3 h-3 text-[#484f58]" />}
          </button>
          <Link
            href={`/zones/${asset.zone_id}`}
            className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono transition-colors flex items-center gap-1.5 btn-interactive"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#8b949e]" />
            <span>Zone Overview</span>
          </Link>
        </div>
      </div>

      {/* Row 1: RUL + Health Index + Key Metrics (Money loss tracked only on Admin) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="scada-card p-4 flex flex-col justify-between bg-[#161b22] border-[#30363d]">
          <span className="text-[10px] font-mono text-[#8b949e] uppercase">PREDICTED RUL (50%ile)</span>
          <div className="my-1">
            <span className={`text-3xl font-light font-mono-nums ${asset.prediction.rul_cycles < 50 ? "text-[#f85149]" : "text-[#3fb950]"}`}>
              {asset.prediction.rul_cycles}
            </span>
            <span className="text-xs font-mono text-[#8b949e] ml-1">cycles</span>
          </div>
          <span className="text-[10px] font-mono text-[#8b949e]">
            95% CI: [{asset.prediction.rul_ci_lower} - {asset.prediction.rul_ci_upper}]
          </span>
        </div>

        <MetricCard
          title="Health Index"
          value={asset.prediction.health_index.toFixed(1)}
          unit="/100"
          status={asset.prediction.health_index > 75 ? "healthy" : asset.prediction.health_index > 45 ? "warning" : "critical"}
          subtitle={`Lead Time: ${asset.prediction.lead_time_hours}h`}
        />

        <MetricCard
          title="Failure Mode Risk"
          value={`${asset.prediction.failure_mode_probability.toFixed(0)}%`}
          status={asset.prediction.health_state === "Critical" ? "critical" : "warning"}
          subtitle={asset.prediction.failure_mode}
        />

        {/* MONEY LOSS TRACKING ONLY IN ADMIN'S DASHBOARD */}
        {isAdmin ? (
          <MetricCard
            title="Downtime Exposure"
            value={`$${(asset.prediction.downtime_cost_risk_usd / 1000).toFixed(0)}k`}
            status={asset.prediction.health_state === "Critical" ? "critical" : "warning"}
            subtitle="Estimated Financial Risk"
          />
        ) : (
          <MetricCard
            title="Motor Current"
            value={asset.motor_current_a.toFixed(1)}
            unit="A"
            status={asset.motor_current_a > 140 ? "warning" : "healthy"}
            subtitle="Phase RMS Draw"
          />
        )}

        <MetricCard
          title="Triaxial Vibration"
          value={asset.vibration_x.toFixed(2)}
          unit="mm/s"
          status={asset.vibration_x > 2.8 ? "critical" : "healthy"}
          subtitle={`Peak: ${asset.vibration_peak.toFixed(2)} mm/s`}
        />

        <MetricCard
          title="Bearing RTD Temp"
          value={asset.temperature_bearing.toFixed(1)}
          unit="°C"
          status={asset.temperature_bearing > 80 ? "critical" : "healthy"}
          subtitle={`Motor: ${asset.temperature_motor.toFixed(1)}°C`}
        />
      </div>

      {/* Row 2: 3D WebGL Digital Twin + Prescriptive Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: 3D WebGL Digital Twin for THIS SPECIFIC ASSET */}
        <div className="lg:col-span-2">
          <ThreeDigitalTwinViewer asset={asset} />
        </div>

        {/* Right Col: AI Prescription & SHAP Feature Contribution */}
        <div className="space-y-4">
          {/* Prescriptive Recommendation Card */}
          <div className="scada-card p-4 bg-[#161b22] border-[#30363d]">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                <h3 className="text-xs font-mono font-bold text-[#58a6ff] uppercase">
                  AI Prescriptive Mitigation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                Confidence: {asset.prediction.failure_mode_probability.toFixed(0)}%
              </span>
            </div>

            <p className="text-xs font-mono text-[#c9d1d9] leading-relaxed mb-3">
              {asset.prediction.prescriptive_action}
            </p>

            <div className="space-y-2 pt-2 border-t border-[#30363d] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Estimated Wrench Time:</span>
                <strong className="text-[#c9d1d9]">{asset.prediction.estimated_wrench_time_hrs} hours</strong>
              </div>

              <div>
                <span className="text-[#8b949e] block mb-1">Required OEM Spare Parts:</span>
                <ul className="space-y-1 pl-2">
                  {asset.prediction.required_parts.map((p, i) => (
                    <li key={i} className="text-[11px] text-[#c9d1d9] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#388bfd]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={handleCreateWorkOrder}
              disabled={!hasPermission("canDispatchWorkOrders")}
              className={`mt-4 w-full py-2 rounded text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 btn-interactive ${
                hasPermission("canDispatchWorkOrders")
                  ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
                  : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Convert to Active Work Order</span>
              {!hasPermission("canDispatchWorkOrders") && <Lock className="w-3 h-3 text-[#484f58]" />}
            </button>
          </div>

          {/* SHAP Feature Contribution Breakdown */}
          <div className="scada-card p-4 bg-[#161b22]">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase mb-2.5 border-b border-[#30363d] pb-2">
              SHAP / Feature Risk Attribution (%)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {Object.entries(asset.prediction.shap_contributions || {}).map(([feature, pct]) => (
                <div key={feature} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#c9d1d9] truncate">{feature}</span>
                    <span className="text-[#f85149] font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#0d1117] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f85149] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Multi-Sensor Live Waveform Oscilloscopes for THIS MACHINE ONLY */}
      <div className="scada-card p-4 bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              {asset.id.toUpperCase()} Multi-Channel Live Sensor Array
            </h3>
            <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">
              Live telemetry streams captured specifically for {asset.name}
            </p>
          </div>
          <span className="text-xs font-mono text-[#3fb950] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ea043]" /> 7 Channels Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <OscilloscopeChart
            label="Triaxial Vibration (X-Axis)"
            unit="mm/s"
            currentValue={asset.vibration_x}
            warnThreshold={2.8}
            critThreshold={4.5}
            lineColor="#f85149"
            dataPoints={[
              asset.vibration_x * 0.85,
              asset.vibration_x * 1.05,
              asset.vibration_x * 0.95,
              asset.vibration_x * 1.15,
              asset.vibration_x
            ]}
          />

          <OscilloscopeChart
            label="Bearing RTD Temp"
            unit="°C"
            currentValue={asset.temperature_bearing}
            warnThreshold={75.0}
            critThreshold={90.0}
            lineColor="#d29922"
            dataPoints={[
              asset.temperature_bearing - 2,
              asset.temperature_bearing - 1,
              asset.temperature_bearing - 1.5,
              asset.temperature_bearing
            ]}
          />

          <OscilloscopeChart
            label="Motor Current (MCSA)"
            unit="A"
            currentValue={asset.motor_current_a}
            warnThreshold={140.0}
            critThreshold={165.0}
            lineColor="#388bfd"
            dataPoints={[
              asset.motor_current_a - 4,
              asset.motor_current_a + 2,
              asset.motor_current_a - 1,
              asset.motor_current_a
            ]}
          />

          <OscilloscopeChart
            label="Ultrasound Acoustic"
            unit="dB"
            currentValue={asset.acoustic_emission_db}
            warnThreshold={55.0}
            critThreshold={75.0}
            lineColor="#58a6ff"
            dataPoints={[
              asset.acoustic_emission_db - 3,
              asset.acoustic_emission_db + 2,
              asset.acoustic_emission_db - 1,
              asset.acoustic_emission_db
            ]}
          />
        </div>
      </div>

      {/* Row 4: Interactive What-If Stress Simulator for THIS MACHINE */}
      <WhatIfSimulator asset={asset} />
    </div>
  );
}
