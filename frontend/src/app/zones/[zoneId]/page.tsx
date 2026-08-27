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
import OscilloscopeChart from "@/components/common/OscilloscopeChart";
import { fetchZoneAnalytics, createWorkOrder } from "@/lib/api";
import { Sliders, Wrench, CheckCircle2, Lock, ArrowRight, ShieldAlert, AlertTriangle, Eye, ChevronRight } from "lucide-react";

export default function ZonePage() {
  const params = useParams();
  const zoneId = (params.zoneId as string) || "production";
  const { zones, assets, alerts } = useTelemetry();
  const { role, roleInfo, hasPermission, canAccessZone, setRole } = useRole();

  const zone = zones.find(z => z.id === zoneId) || zones[0];
  const zoneAssets = assets.filter(a => a.zone_id === zoneId);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(zoneAssets[0]?.id || "cmp-01");
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isAuthorized = canAccessZone(zoneId);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (zoneAssets.length > 0 && !zoneAssets.some(a => a.id === selectedAssetId)) {
      setSelectedAssetId(zoneAssets[0].id);
    }
  }, [zoneId, zoneAssets]);

  useEffect(() => {
    fetchZoneAnalytics(zoneId).then(data => setAnalytics(data));
  }, [zoneId]);

  const selectedAsset = zoneAssets.find(a => a.id === selectedAssetId) || zoneAssets[0] || assets[0];
  const zoneAlerts = alerts.filter(a => a.zone_id === zoneId);

  const handleGenerateWorkOrder = async () => {
    if (!hasPermission("canDispatchWorkOrders")) {
      setActionNotice("Requires Supervisor clearance to dispatch work orders.");
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    await createWorkOrder({
      asset_id: selectedAsset.id,
      asset_name: selectedAsset.name,
      zone_id: zone.id,
      zone_name: zone.name,
      priority: selectedAsset.health_state === "Critical" ? "P1 - Emergency" : "P2 - High",
      title: `Corrective Maintenance: ${selectedAsset.prediction.failure_mode}`,
      prescriptive_procedure: selectedAsset.prediction.prescriptive_action,
      required_parts: selectedAsset.prediction.required_parts,
      estimated_hours: selectedAsset.prediction.estimated_wrench_time_hrs,
      estimated_cost_usd: selectedAsset.prediction.downtime_cost_risk_usd * 0.1
    });

    setActionNotice(`Dispatched corrective work order for ${selectedAsset.id.toUpperCase()}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // If user is restricted by Zone-Scoped RBAC
  if (!isAuthorized) {
    return (
      <div className="space-y-5">
        <ZoneSwitcher currentZoneId={zoneId} />

        <div className="scada-card p-8 bg-[#161b22] border-[#30363d] text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-[#d29922]/15 border border-[#d29922]/40 text-[#e3b341] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase">
              Zone Access Restricted
            </h2>
            <p className="text-xs text-[#8b949e] font-mono mt-1 leading-relaxed">
              Your active station profile (<strong className="text-[#c9d1d9]">{roleInfo.userName}</strong>) is scoped to <strong className="text-[#58a6ff]">{roleInfo.assignedZoneName}</strong>.
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
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher currentZoneId={zoneId} />

      {/* Zone Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              OPERATIONAL ZONE
            </span>
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              {zone?.name || "Zone Overview"}
            </h2>
            <StatusBadge status={zone?.status || "Healthy"} size="sm" />
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-1">
            Zone Lead: <strong className="text-[#c9d1d9]">{zone?.supervisor}</strong> • {zone?.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionNotice && (
            <span className="text-xs font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionNotice}
            </span>
          )}

          <button
            onClick={handleGenerateWorkOrder}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 btn-interactive ${
              hasPermission("canDispatchWorkOrders")
                ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
                : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
            }`}
            title={hasPermission("canDispatchWorkOrders") ? "Dispatch Work Order" : "Requires Supervisor clearance"}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Assign Maintenance Tech</span>
            {!hasPermission("canDispatchWorkOrders") && <Lock className="w-3 h-3 text-[#484f58]" />}
          </button>

          <Link
            href="/settings"
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono transition-colors flex items-center gap-1.5 btn-interactive"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8b949e]" />
            <span>Zone Calibration</span>
          </Link>
        </div>
      </div>

      {/* Zone Metrics Row (Cost tracked only on Admin) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Zone OEE"
          value={zone?.oee || 88.5}
          unit="%"
          status={zone?.oee && zone.oee > 85 ? "healthy" : "warning"}
          subtitle={`A:${zone?.availability}% P:${zone?.performance}% Q:${zone?.quality}%`}
        />
        <MetricCard
          title="Health Score"
          value={zone?.health_score || 85}
          unit="/100"
          status={zone?.health_score && zone.health_score > 75 ? "healthy" : "critical"}
          subtitle="Composite Reliability Index"
        />
        <MetricCard
          title="Supervised Assets"
          value={zoneAssets.length}
          subtitle={`${zone?.healthy_assets || 0} OK • ${zone?.warning_assets || 0} Monitor • ${zone?.critical_assets || 0} Attention`}
        />
        <MetricCard
          title="Active Alarms"
          value={zoneAlerts.length}
          status={zoneAlerts.some(a => a.severity === "CRITICAL") ? "critical" : "warning"}
          subtitle="Live SCADA alarms in zone"
        />
        <MetricCard
          title="24h Downtime"
          value={`${zone?.downtime_hrs_24h || 0.4}h`}
          status={zone?.downtime_hrs_24h && zone.downtime_hrs_24h > 1.0 ? "warning" : "healthy"}
          subtitle={isAdmin ? `Cost: $${((zone?.downtime_cost_24h_usd || 4200) / 1000).toFixed(1)}k` : "Operating Uptime: 99.4%"}
        />
        <MetricCard
          title="Zone Power"
          value={zone?.power_consumption_kwh || 350}
          unit="kW"
          status="neutral"
          subtitle="Active Consumption"
        />
      </div>

      {/* Simplified Machinery Fleet Grid in This Zone */}
      <div className="scada-card p-4 bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Zone Machinery Fleet ({zoneAssets.length} Assets)
            </h3>
            <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">
              Select any machine to view its 3D WebGL Digital Twin and dedicated live telemetry
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8b949e]">Click card to inspect</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {zoneAssets.map(a => {
            const isSelected = a.id === selectedAssetId;
            const isUrgent = a.health_state === "Critical";

            return (
              <div
                key={a.id}
                onClick={() => setSelectedAssetId(a.id)}
                className={`p-3.5 rounded border cursor-pointer transition-all btn-interactive ${
                  isSelected
                    ? "bg-[#21262d] border-[#388bfd] shadow-sm ring-1 ring-[#388bfd]/50"
                    : "bg-[#0d1117] border-[#30363d] hover:bg-[#21262d]/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#f0f6fc] truncate">
                    {a.id.toUpperCase()}: {a.name}
                  </span>
                  <StatusBadge status={a.health_state} size="sm" />
                </div>

                {/* Simplified Card: Focus on Attention Focus & Health Index */}
                <div className="p-2 rounded bg-[#161b22] border border-[#30363d] text-xs font-mono my-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8b949e]">Attention Focus:</span>
                    <span className={`font-semibold ${isUrgent ? "text-[#f85149]" : "text-[#e3b341]"}`}>
                      {a.prediction.failure_mode}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8b949e]">Projected RUL:</span>
                    <span className={`font-semibold ${a.prediction.rul_cycles < 50 ? "text-[#f85149]" : "text-[#3fb950]"}`}>
                      {a.prediction.rul_cycles} cyc ({a.prediction.rul_hours}h)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] mt-2">
                  <span>Health: <strong className="text-[#c9d1d9]">{a.prediction.health_index.toFixed(1)}%</strong></span>
                  <Link
                    href={`/assets/${a.id}`}
                    className="text-[#58a6ff] hover:text-[#79b8ff] font-semibold flex items-center gap-1 btn-interactive"
                    onClick={e => e.stopPropagation()}
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Machine 3D Digital Twin + Live Oscilloscope Sensors for ONLY the selected machine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Interactive 3D WebGL Digital Twin */}
        <div className="lg:col-span-2">
          {selectedAsset && <ThreeDigitalTwinViewer asset={selectedAsset} />}
        </div>

        {/* Right Col: Live Sensor Waveforms & Prescriptive Action */}
        <div className="space-y-4">
          <div className="scada-card p-4 bg-[#161b22]">
            <div className="border-b border-[#30363d] pb-2 mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
                {selectedAsset?.id.toUpperCase()} Live Telemetry
              </h3>
              <span className="w-2 h-2 rounded-full bg-[#2ea043]" />
            </div>

            <div className="space-y-3">
              <OscilloscopeChart
                label="Triaxial Vibration (X-Axis)"
                unit="mm/s"
                currentValue={selectedAsset?.vibration_x || 1.25}
                warnThreshold={2.8}
                critThreshold={4.5}
                lineColor="#f85149"
                dataPoints={[
                  selectedAsset?.vibration_x * 0.85 || 1.1,
                  selectedAsset?.vibration_x * 1.05 || 1.3,
                  selectedAsset?.vibration_x * 0.92 || 1.2,
                  selectedAsset?.vibration_x * 1.15 || 1.4,
                  selectedAsset?.vibration_x * 0.98 || 1.2,
                  selectedAsset?.vibration_x * 1.02 || 1.25,
                  selectedAsset?.vibration_x || 1.25
                ]}
              />

              <OscilloscopeChart
                label="Bearing RTD Temperature"
                unit="°C"
                currentValue={selectedAsset?.temperature_bearing || 75.0}
                warnThreshold={75.0}
                critThreshold={90.0}
                lineColor="#d29922"
                dataPoints={[
                  selectedAsset?.temperature_bearing - 1.5 || 73.5,
                  selectedAsset?.temperature_bearing - 0.8 || 74.2,
                  selectedAsset?.temperature_bearing - 1.2 || 73.8,
                  selectedAsset?.temperature_bearing - 0.4 || 74.6,
                  selectedAsset?.temperature_bearing || 75.0
                ]}
              />
            </div>
          </div>

          {/* AI Prescriptive Card */}
          <div className="scada-card p-4 bg-[#161b22] border-[#30363d]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
              <h4 className="text-xs font-mono font-bold text-[#58a6ff] uppercase">
                AI Prescriptive Action
              </h4>
            </div>
            <p className="text-xs font-mono text-[#c9d1d9] leading-relaxed mb-3">
              {selectedAsset?.prediction.prescriptive_action}
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] pt-2 border-t border-[#30363d]">
              <span>Wrench Time: <strong className="text-[#c9d1d9]">{selectedAsset?.prediction.estimated_wrench_time_hrs}h</strong></span>
              {isAdmin ? (
                <span>Risk: <strong className="text-[#e3b341]">${((selectedAsset?.prediction.downtime_cost_risk_usd || 12000) / 1000).toFixed(0)}k</strong></span>
              ) : (
                <span>Urgency: <strong className="text-[#f85149]">P1 High Wear</strong></span>
              )}
            </div>
            <button
              onClick={handleGenerateWorkOrder}
              disabled={!hasPermission("canDispatchWorkOrders")}
              className={`mt-3 w-full py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 btn-interactive ${
                hasPermission("canDispatchWorkOrders")
                  ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
                  : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Generate Work Order</span>
              {!hasPermission("canDispatchWorkOrders") && <Lock className="w-3 h-3 text-[#484f58]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
