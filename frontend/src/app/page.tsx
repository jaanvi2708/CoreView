"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import MetricCard from "@/components/common/MetricCard";
import StatusBadge from "@/components/common/StatusBadge";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import FactoryMapTwin from "@/components/digital-twins/FactoryMapTwin";
import ThreeDigitalTwinViewer from "@/components/digital-twins/ThreeDigitalTwinViewer";
import { acknowledgeAlert } from "@/lib/api";
import { Activity, ShieldAlert, Cpu, CheckCircle2, Sliders, Wrench, ArrowRight, AlertTriangle, ChevronRight } from "lucide-react";

export default function MainControlDashboard() {
  const { overview, assets, zones, alerts, isConnected, acknowledgeAlertLocal } = useTelemetry();
  const { role, roleInfo, hasPermission, canAccessZone } = useRole();
  const [selectedAssetId, setSelectedAssetId] = useState<string>("cmp-01");
  const [ackNotice, setAckNotice] = useState<string | null>(null);

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];
  const unackAlerts = alerts.filter(a => !a.acknowledged);

  const isAdmin = role === "admin";

  // Filter top risk assets based on user's authorized zone scope if restricted
  const scopedRiskAssets = (overview.top_risk_assets || []).filter(ra => {
    if (!roleInfo.assignedZoneId) return true;
    return ra.zone_id === roleInfo.assignedZoneId;
  });

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    acknowledgeAlertLocal(alertId);
    setAckNotice(`Acknowledged alert ${alertId}`);
    setTimeout(() => setAckNotice(null), 3000);
  };

  const handleAcknowledgeAll = async () => {
    for (const a of unackAlerts) {
      await acknowledgeAlert(a.id);
      acknowledgeAlertLocal(a.id);
    }
    setAckNotice("All active alerts acknowledged.");
    setTimeout(() => setAckNotice(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* 1-Click Facility Zones Navigation Ribbon */}
      <ZoneSwitcher />

      {/* Top SCADA Operational Status & Station Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-3.5 rounded-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-[#21262d] border border-[#388bfd]/50 text-[#58a6ff] font-mono text-xs font-bold">
            SCADA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#f0f6fc] uppercase tracking-tight">
                {overview.ai_monitoring_status || "AI Quantile Inference Active"}
              </span>
              <StatusBadge status="Optimal" size="sm" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                {roleInfo.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
              Active Station: <strong className="text-[#c9d1d9]">{roleInfo.userName}</strong> ({roleInfo.userTitle}) • Scope: <strong className="text-[#58a6ff]">{roleInfo.assignedZoneName}</strong>
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          {ackNotice && (
            <span className="text-xs font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ackNotice}
            </span>
          )}
          {unackAlerts.length > 0 && hasPermission("canAcknowledgeAlerts") && (
            <button
              onClick={handleAcknowledgeAll}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono font-medium transition-colors btn-interactive"
            >
              Acknowledge All ({unackAlerts.length})
            </button>
          )}
          <Link
            href="/alerts-work-orders"
            className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 btn-interactive"
          >
            <Wrench className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Work Orders Dispatch</span>
          </Link>
        </div>
      </div>

      {/* Row 1: High-Level SCADA KPI Matrix (Financial loss tracked ONLY in Admin dashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Overall OEE"
          value={overview.overall_oee}
          unit="%"
          status={overview.overall_oee > 85 ? "healthy" : "warning"}
          subtitle={`A:${overview.overall_availability}% P:${overview.overall_performance}% Q:${overview.overall_quality}%`}
          trend="+1.2% Target"
          trendPositive={true}
        />
        <MetricCard
          title="Active Alerts"
          value={overview.active_alerts_total}
          status={overview.critical_alerts_count > 0 ? "critical" : "warning"}
          subtitle={`${overview.critical_alerts_count} Action Req • ${overview.warning_alerts_count} Monitor`}
        />
        <MetricCard
          title="Attention Assets"
          value={overview.critical_assets_count}
          status={overview.critical_assets_count > 0 ? "critical" : "healthy"}
          subtitle="Immediate Review Flag"
        />
        <MetricCard
          title="30d Pred Failures"
          value={overview.predicted_failures_30d}
          unit="Assets"
          status="cyan"
          subtitle={`${overview.predicted_failures_7d} in 7-Day Window`}
        />

        {/* FINANCIAL DATA: ONLY ON ADMIN DASHBOARD. PURE MACHINE DATA ON OTHERS */}
        {isAdmin ? (
          <MetricCard
            title="Downtime Savings"
            value={`$${(overview.estimated_downtime_cost_avoided_usd / 1000).toFixed(0)}k`}
            status="healthy"
            subtitle="YTD Cost Avoidance"
            trend="+18.4%"
            trendPositive={true}
          />
        ) : (
          <MetricCard
            title="Avg Fleet RUL"
            value={84.2}
            unit="Cycles"
            status="healthy"
            subtitle="Fleet Wear Health: 88.5%"
            trend="+2.1%"
            trendPositive={true}
          />
        )}

        <MetricCard
          title="Active Plant Power"
          value={overview.total_power_active_mw}
          unit="MW"
          status="neutral"
          subtitle="PF 0.94 • Nominal"
        />
      </div>

      {/* Row 2: Plant Floor Twin & Live Zone Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <FactoryMapTwin
            zones={zones}
            assets={assets}
            onZoneSelect={(zid) => {
              window.location.href = `/zones/${zid}`;
            }}
          />
        </div>

        {/* Right Col: Zone Health Cards */}
        <div className="scada-card p-4 flex flex-col justify-between bg-[#161b22]">
          <div className="border-b border-[#30363d] pb-2.5 mb-2.5">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Facility Zones Status
            </h3>
            <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
              Live composite health and active alarms
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {zones.map(z => {
              const isUserAssigned = roleInfo.assignedZoneId === z.id;
              return (
                <Link
                  key={z.id}
                  href={`/zones/${z.id}`}
                  className={`block p-2.5 rounded border transition-all btn-interactive ${
                    isUserAssigned
                      ? "bg-[#21262d] border-[#388bfd]/60 shadow-sm"
                      : "bg-[#0d1117] hover:bg-[#21262d] border-[#30363d]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                      <span>{z.name}</span>
                      {isUserAssigned && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#388bfd]/20 text-[#58a6ff] font-bold">
                          YOUR ZONE
                        </span>
                      )}
                    </span>
                    <StatusBadge status={z.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                    <span>OEE: <strong className="text-[#c9d1d9]">{z.oee}%</strong></span>
                    <span>Health: <strong className="text-[#c9d1d9]">{z.health_score}%</strong></span>
                    <span>Alarms: <strong className={z.active_alarms_count > 0 ? "text-[#e3b341]" : "text-[#8b949e]"}>{z.active_alarms_count}</strong></span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-[#30363d] mt-2 text-[10px] font-mono text-[#8b949e] flex justify-between">
            <span>Shift 2 Active</span>
            <Link href="/reports" className="text-[#58a6ff] hover:underline flex items-center gap-1 btn-interactive">
              <span>Detailed Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Simplified Machinery Attention Cards & 3D WebGL Digital Twin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Machinery Cards (Showing only what needs attention) */}
        <div className="scada-card p-4 flex flex-col justify-between bg-[#161b22]">
          <div>
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-2.5">
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
                  Machinery Fleet Status
                </h3>
                <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">
                  Items requiring supervisor or operator attention
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#e3b341] font-semibold">
                {scopedRiskAssets.length} Flagged
              </span>
            </div>

            <div className="space-y-2.5">
              {scopedRiskAssets.slice(0, 4).map((ra) => {
                const isSelected = ra.id === selectedAssetId;
                const isUrgent = ra.health_state === "Critical";

                return (
                  <div
                    key={ra.id}
                    onClick={() => setSelectedAssetId(ra.id)}
                    className={`p-3 rounded border cursor-pointer transition-all btn-interactive ${
                      isSelected
                        ? "bg-[#21262d] border-[#388bfd] shadow-sm"
                        : "bg-[#0d1117] border-[#30363d] hover:bg-[#21262d]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-[#f0f6fc] truncate">
                        {ra.id.toUpperCase()}: {ra.name}
                      </span>
                      <StatusBadge status={ra.health_state} size="sm" />
                    </div>

                    {/* Simplified: Show ONLY the machine physical issue that needs attention */}
                    <div className="p-2 rounded bg-[#161b22] border border-[#30363d]/80 text-xs font-mono mb-2">
                      <span className="text-[10px] text-[#8b949e] uppercase block">Attention Focus:</span>
                      <span className={`font-semibold text-xs ${isUrgent ? "text-[#f85149]" : "text-[#e3b341]"}`}>
                        {ra.failure_mode} (RUL: {ra.rul_cycles} cycles)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                      <span>Health Index: <strong className="text-[#c9d1d9]">{ra.health_index.toFixed(1)}%</strong></span>
                      <Link
                        href={`/assets/${ra.id}`}
                        className="text-[#58a6ff] hover:text-[#79b8ff] font-semibold flex items-center gap-1 btn-interactive"
                        onClick={e => e.stopPropagation()}
                      >
                        <span>Deep Dive</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#30363d] text-[11px] font-mono text-[#8b949e] flex justify-between items-center">
            <span>Select machine above to inspect in 3D</span>
            <Link href="/digital-twins" className="text-[#58a6ff] hover:underline btn-interactive">
              All 3D Models →
            </Link>
          </div>
        </div>

        {/* Right 2 Columns: Interactive 3D WebGL Digital Twin of Selected Asset */}
        <div className="lg:col-span-2">
          {selectedAsset ? (
            <ThreeDigitalTwinViewer asset={selectedAsset} />
          ) : (
            <div className="scada-card p-8 flex items-center justify-center text-[#8b949e] font-mono text-sm bg-[#161b22]">
              Loading 3D Digital Twin...
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Real-time Live SCADA Alert Feed */}
      <div className="scada-card p-4 bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#e3b341]" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Operational Alarm Feed & Telemetry Triggers
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8b949e]">
            {alerts.length} Active System Events
          </span>
        </div>

        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {alerts.map(a => {
            return (
              <div
                key={a.id}
                className={`p-3 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  a.severity === "CRITICAL"
                    ? "bg-[#da3633]/10 border-[#da3633]/30"
                    : a.severity === "WARNING"
                    ? "bg-[#d29922]/10 border-[#d29922]/30"
                    : "bg-[#0d1117] border-[#30363d]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.severity} size="sm" />
                    <span className="text-xs font-mono font-bold text-[#f0f6fc]">
                      {a.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      [{a.zone_name}]
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#8b949e]">
                    {a.description}
                  </p>
                  <div className="text-[10px] font-mono text-[#8b949e] flex flex-wrap gap-3">
                    <span>Trigger: <strong className="text-[#c9d1d9]">{a.sensor_trigger} ({a.trigger_value})</strong></span>
                    <span>Lead Time: <strong className="text-[#58a6ff]">{a.lead_time_hours}h</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!a.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono transition-colors btn-interactive"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-2 py-0.5 rounded">
                      ACKNOWLEDGED
                    </span>
                  )}
                  <Link
                    href={`/assets/${a.asset_id}`}
                    className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] rounded text-xs font-mono font-semibold transition-colors btn-interactive"
                  >
                    Investigate
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
