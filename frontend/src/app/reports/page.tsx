"use client";

import React, { useState, useEffect } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import MetricCard from "@/components/common/MetricCard";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import { fetchReportsAnalytics } from "@/lib/api";
import { FileSpreadsheet, Download, CheckCircle2, ArrowDownToLine, Lock } from "lucide-react";

export default function ReportsPage() {
  const { role, roleInfo } = useRole();
  const [timeframe, setTimeframe] = useState<string>("30d");
  const [analytics, setAnalytics] = useState<any>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    fetchReportsAnalytics(timeframe).then((data: any) => setAnalytics(data));
  }, [timeframe]);

  const handleExport = (format: "CSV" | "PDF" | "XLSX") => {
    setExportNotice(`Generated ${format} report bundle. Download started.`);
    
    // Create direct CSV export data
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Zone,MTBF_Hours,MTTR_Hours,Availability_Pct,Criticality\n" +
      (analytics?.reliability_metrics || []).map((r: any) => 
        `"${r.zone}",${r.mtbf_hours},${r.mttr_hours},${r.availability_pct},"${r.criticality}"`
      ).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CoreView_Reliability_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher />

      {/* Top Header & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              Plant Reliability & Analytics Suite
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-0.5">
            Downtime Pareto Analysis • MTBF / MTTR Reliability Curves • Physical Equipment Auditing
          </p>
        </div>

        {/* Timeframe Filter + Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0d1117] p-1 rounded border border-[#30363d] text-xs font-mono">
            {["7d", "30d", "90d", "1y"].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded uppercase font-semibold transition-colors ${
                  timeframe === tf ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd]" : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport("PDF")}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono transition-colors btn-interactive"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport("XLSX")}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#3fb950] border border-[#30363d] rounded text-xs font-mono font-semibold transition-colors btn-interactive"
            >
              Export Excel
            </button>
            <button
              onClick={() => handleExport("CSV")}
              className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-mono font-semibold shadow-sm transition-colors flex items-center gap-1 btn-interactive"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded bg-[#21262d] border border-[#238636]/60 text-[#3fb950] text-xs font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Row 1: Key KPIs (Financial tracked ONLY on Admin, Technical availability on others) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isAdmin ? (
          <MetricCard
            title="Total Financial ROI"
            value={`$${((analytics?.cost_metrics?.total_financial_impact_usd || 674500) / 1000).toFixed(0)}k`}
            status="healthy"
            subtitle="Downtime & Damage Avoided"
            trend="+24.2% YoY"
            trendPositive={true}
          />
        ) : (
          <MetricCard
            title="Plant Availability"
            value="97.8"
            unit="%"
            status="healthy"
            subtitle="Operational Production Uptime"
            trend="+1.4% Target"
            trendPositive={true}
          />
        )}
        <MetricCard
          title="Plant-Wide MTBF"
          value="608"
          unit="Hours"
          status="healthy"
          subtitle="Mean Time Between Failures"
        />
        <MetricCard
          title="Mean Time To Repair"
          value="2.3"
          unit="Hours"
          status="cyan"
          subtitle="Average Wrench Time"
        />
        <MetricCard
          title="Faults Prevented"
          value="22 Events"
          status="healthy"
          subtitle="Caught by AI Early Lead Time"
        />
      </div>

      {/* Row 2: Downtime Pareto Analysis & Reliability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Downtime Pareto Chart */}
        <div className="scada-card p-4 space-y-3 bg-[#161b22]">
          <div className="border-b border-[#30363d] pb-2 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Root Cause Downtime Pareto ({timeframe})
            </h3>
            <span className="text-[10px] font-mono text-[#8b949e]">Hours Lost & Cumulative %</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {(analytics?.downtime_pareto || []).map((p: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#c9d1d9] truncate">{p.root_cause}</span>
                  <span className="text-[#e3b341] font-semibold shrink-0 ml-2">
                    {p.downtime_hours}h {isAdmin && `(${(p.cost_usd / 1000).toFixed(0)}k)`} • {p.cumulative_pct}% Cum.
                  </span>
                </div>
                <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full ${i === 0 ? "bg-[#f85149]" : i === 1 ? "bg-[#d29922]" : "bg-[#58a6ff]"}`}
                    style={{ width: `${p.cumulative_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Reliability & Criticality Matrix */}
        <div className="scada-card p-4 space-y-3 bg-[#161b22]">
          <div className="border-b border-[#30363d] pb-2 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Zone MTBF / MTTR Performance
            </h3>
            <span className="text-[10px] font-mono text-[#8b949e]">Reliability Auditing</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e] text-[10px] uppercase">
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">MTBF</th>
                  <th className="pb-2">MTTR</th>
                  <th className="pb-2">Avail %</th>
                  <th className="pb-2">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60">
                {(analytics?.reliability_metrics || []).map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#21262d]/40">
                    <td className="py-2.5 font-semibold text-[#f0f6fc]">{r.zone}</td>
                    <td className="py-2.5 text-[#c9d1d9]">{r.mtbf_hours}h</td>
                    <td className="py-2.5 text-[#58a6ff]">{r.mttr_hours}h</td>
                    <td className="py-2.5 text-[#3fb950] font-semibold">{r.availability_pct}%</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#21262d] border border-[#30363d] text-[#c9d1d9]">
                        {r.criticality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Automated Scheduled Reports Configuration */}
      <div className="scada-card p-4 bg-[#161b22]">
        <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase mb-2.5 border-b border-[#30363d] pb-2">
          Automated Scheduled Dispatch Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-[#8b949e] text-[10px] block">DAILY SHIFT SUMMARY</span>
            <strong className="text-[#f0f6fc]">06:00 UTC Automated CSV</strong>
            <p className="text-[#8b949e] text-[11px]">Auto-emailed to Station Leads</p>
          </div>
          <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-[#8b949e] text-[10px] block">WEEKLY RELIABILITY AUDIT</span>
            <strong className="text-[#f0f6fc]">Sundays 23:59 UTC PDF</strong>
            <p className="text-[#8b949e] text-[11px]">Includes MTBF & Pareto Curves</p>
          </div>
          <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-[#8b949e] text-[10px] block">MONTHLY ISO 13374 AUDIT</span>
            <strong className="text-[#f0f6fc]">1st of Month XLSX</strong>
            <p className="text-[#8b949e] text-[11px]">Full Telemetry Historical Archive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
