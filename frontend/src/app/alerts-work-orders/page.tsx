"use client";

import React, { useState, useEffect } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import StatusBadge from "@/components/common/StatusBadge";
import MetricCard from "@/components/common/MetricCard";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import { fetchWorkOrders, convertAlertToWorkOrder, updateWorkOrderStatus, createWorkOrder, acknowledgeAlert } from "@/lib/api";
import { AlertItem, WorkOrder } from "@/lib/types";
import { ShieldAlert, Wrench, CheckCircle2, Lock, ArrowRight } from "lucide-react";

export default function AlertsWorkOrdersPage() {
  const { alerts, assets, acknowledgeAlertLocal } = useTelemetry();
  const { role, roleInfo, hasPermission } = useRole();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [tab, setTab] = useState<"alerts" | "work_orders">("alerts");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedAlertForWO, setSelectedAlertForWO] = useState<AlertItem | null>(null);
  const [assignedTech, setAssignedTech] = useState<string>("MECH-A01");
  const [notice, setNotice] = useState<string | null>(null);

  const loadWorkOrders = async () => {
    const wos = await fetchWorkOrders();
    setWorkOrders(wos);
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    if (!hasPermission("canAcknowledgeAlerts")) {
      setNotice("Unauthorized: You do not have permission to acknowledge alerts.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    await acknowledgeAlert(alertId);
    acknowledgeAlertLocal(alertId);
    setNotice(`Alert ${alertId} acknowledged.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleConvertToWO = async (alertItem: AlertItem) => {
    if (!hasPermission("canDispatchWorkOrders")) {
      setNotice("Requires Level 2 (Supervisor) clearance to dispatch work orders.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const wo = await convertAlertToWorkOrder(alertItem.id, assignedTech);
    setWorkOrders(prev => [wo, ...prev]);
    acknowledgeAlertLocal(alertItem.id);
    setSelectedAlertForWO(null);
    setTab("work_orders");
    setNotice(`Generated Work Order ${wo.id} from alert.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleStatusChange = async (woId: string, newStatus: string) => {
    if (!hasPermission("canDispatchWorkOrders")) {
      setNotice("Requires Level 2+ Supervisor clearance to update work order status.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    await updateWorkOrderStatus(woId, newStatus);
    setWorkOrders(prev =>
      prev.map(w => (w.id === woId ? { ...w, status: newStatus as any } : w))
    );
    setNotice(`Work Order ${woId} updated to ${newStatus}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    return true;
  });

  const filteredWOs = workOrders.filter(w => {
    if (statusFilter !== "ALL" && w.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#f85149]" />
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              SCADA Alarm Feed & Work Order Dispatch
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-0.5">
            Prioritized Telemetry Alarms • 1-Click Corrective Work Orders • Technician & Parts Allocation
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] p-1 rounded border border-[#30363d] text-xs font-mono">
          <button
            onClick={() => setTab("alerts")}
            className={`px-4 py-1.5 rounded transition-colors ${
              tab === "alerts" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            Live Alarms ({alerts.length})
          </button>
          <button
            onClick={() => setTab("work_orders")}
            className={`px-4 py-1.5 rounded transition-colors ${
              tab === "work_orders" ? "bg-[#21262d] text-[#ffffff] border border-[#388bfd] font-semibold" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            Work Orders ({workOrders.length})
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded bg-[#21262d] border border-[#388bfd] text-[#58a6ff] text-xs font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Active Alarms"
          value={alerts.filter(a => !a.acknowledged).length}
          status="critical"
          subtitle={`${alerts.filter(a => a.severity === "CRITICAL" && !a.acknowledged).length} Critical • ${alerts.filter(a => a.severity === "WARNING" && !a.acknowledged).length} Warning`}
        />
        <MetricCard
          title="Open Work Orders"
          value={workOrders.filter(w => w.status !== "Completed").length}
          status="warning"
          subtitle={`${workOrders.filter(w => w.status === "In Progress").length} In Progress`}
        />
        <MetricCard
          title="Avg Lead Time"
          value="58.4"
          unit="Hours"
          status="cyan"
          subtitle="AI Advance Notice"
        />
        <MetricCard
          title="Spare Parts Stocked"
          value="98.5%"
          status="healthy"
          subtitle="Critical Asset Reserve"
        />
      </div>

      {/* Tab Content 1: Live Alarms Feed & 1-Click Work Order Modal */}
      {tab === "alerts" && (
        <div className="scada-card p-4 space-y-4 bg-[#161b22]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-2.5">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Prioritized Alarms Matrix ({filteredAlerts.length} Events)
            </h3>
            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#8b949e] mr-1">Severity:</span>
              {["ALL", "CRITICAL", "WARNING", "INFO"].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-1 rounded text-[11px] ${
                    severityFilter === s
                      ? "bg-[#21262d] text-[#ffffff] font-bold border border-[#30363d]"
                      : "text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredAlerts.map(a => (
              <div
                key={a.id}
                className={`p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  a.severity === "CRITICAL"
                    ? "bg-[#da3633]/10 border-[#da3633]/30"
                    : a.severity === "WARNING"
                    ? "bg-[#d29922]/10 border-[#d29922]/30"
                    : "bg-[#0d1117] border-[#30363d]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.severity} size="sm" />
                    <span className="text-xs font-mono font-bold text-[#f0f6fc]">
                      {a.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      [{a.zone_name}] • {a.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#c9d1d9]">
                    {a.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[11px] font-mono text-[#8b949e]">
                    <span>Trigger: <strong className="text-[#c9d1d9]">{a.sensor_trigger}</strong> (<strong className="text-[#f85149]">{a.trigger_value}</strong> vs {a.threshold_value})</span>
                    <span>Lead Time: <strong className="text-[#58a6ff]">{a.lead_time_hours}h</strong></span>
                    <span>Cost Exposure: <strong className="text-[#e3b341]">${(a.estimated_cost_usd / 1000).toFixed(0)}k</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!a.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-mono border border-[#30363d] transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlertForWO(a)}
                    disabled={!hasPermission("canDispatchWorkOrders")}
                    className={`px-3.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                      hasPermission("canDispatchWorkOrders")
                        ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
                        : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>1-Click Work Order</span>
                    {!hasPermission("canDispatchWorkOrders") && <Lock className="w-3 h-3 text-[#484f58]" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Work Orders Lifecycle Management */}
      {tab === "work_orders" && (
        <div className="scada-card p-4 space-y-4 bg-[#161b22]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-2.5">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Maintenance Work Orders Dispatch ({filteredWOs.length} Active)
            </h3>
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#8b949e] mr-1">Status:</span>
              {["ALL", "Open", "Assigned", "In Progress", "Completed"].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] ${
                    statusFilter === st
                      ? "bg-[#21262d] text-[#ffffff] font-bold border border-[#30363d]"
                      : "text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredWOs.map(wo => (
              <div
                key={wo.id}
                className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#58a6ff]">{wo.id}</span>
                    <span className="text-xs font-mono font-bold text-[#f0f6fc]">{wo.title}</span>
                    <StatusBadge status={wo.priority} size="sm" />
                    <StatusBadge status={wo.status} size="sm" />
                  </div>
                  <span className="text-[10px] font-mono text-[#8b949e]">Created: {wo.created_at}</span>
                </div>

                <div className="p-3 bg-[#161b22] rounded border border-[#30363d] text-xs font-mono text-[#c9d1d9]">
                  <strong className="text-[#8b949e] block mb-1">Prescriptive Procedure:</strong>
                  {wo.prescriptive_procedure}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-[#8b949e] pt-2 border-t border-[#30363d]">
                  <div>
                    <span className="block text-[10px]">ASSIGNED TECHNICIAN</span>
                    <strong className="text-[#c9d1d9]">{wo.assigned_to || "Unassigned"}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px]">PARTS ALLOCATED</span>
                    <strong className="text-[#c9d1d9] truncate block">
                      {wo.required_parts.join(", ")} ({wo.parts_status})
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px]">ESTIMATED WRENCH TIME</span>
                    <strong className="text-[#58a6ff]">{wo.estimated_hours} Hours (${wo.estimated_cost_usd} USD)</strong>
                  </div>
                </div>

                {/* Status Transition Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#30363d]/80 text-xs font-mono">
                  <span className="text-[#8b949e] text-[11px]">
                    Update Status:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(wo.id, "Assigned")}
                      disabled={!hasPermission("canDispatchWorkOrders")}
                      className={`px-2.5 py-1 rounded text-[11px] ${wo.status === "Assigned" ? "bg-[#21262d] text-white font-bold border border-[#30363d]" : "bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]"}`}
                    >
                      Assigned
                    </button>
                    <button
                      onClick={() => handleStatusChange(wo.id, "In Progress")}
                      disabled={!hasPermission("canDispatchWorkOrders")}
                      className={`px-2.5 py-1 rounded text-[11px] ${wo.status === "In Progress" ? "bg-[#d29922] text-black font-bold" : "bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]"}`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(wo.id, "Completed")}
                      disabled={!hasPermission("canDispatchWorkOrders")}
                      className={`px-2.5 py-1 rounded text-[11px] ${wo.status === "Completed" ? "bg-[#238636] text-white font-bold" : "bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]"}`}
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1-Click Convert Alert to Work Order Modal */}
      {selectedAlertForWO && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="scada-card w-full max-w-lg p-5 bg-[#161b22] border-[#30363d] space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-mono font-bold text-[#f0f6fc] uppercase">
                  Create Corrective Work Order from Alert
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForWO(null)}
                className="text-[#8b949e] hover:text-[#f0f6fc] font-mono text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#0d1117] rounded border border-[#30363d]">
                <span className="text-[#8b949e] block text-[10px]">SOURCE ALARM</span>
                <strong className="text-[#f85149] block">{selectedAlertForWO.title}</strong>
                <span className="text-[#8b949e] text-[11px]">{selectedAlertForWO.description}</span>
              </div>

              <div>
                <label className="block text-[#8b949e] mb-1">ASSIGNED SPECIALIST</label>
                <select
                  value={assignedTech}
                  onChange={e => setAssignedTech(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#c9d1d9]"
                >
                  <option value="MECH-A01">MECH-A01 — Mechanical Technician (Vibration Analyst)</option>
                  <option value="MACH-B02">MACH-B02 — CNC Machine Specialist</option>
                  <option value="ELEC-C03">ELEC-C03 — Electrical & Drives Technician</option>
                  <option value="HYDR-D04">HYDR-D04 — Fluid Power & Hydraulics Technician</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#8b949e] block text-[10px]">ESTIMATED WRENCH TIME</span>
                  <span className="text-[#c9d1d9] font-semibold">3.5 Hours</span>
                </div>
                <div>
                  <span className="text-[#8b949e] block text-[10px]">PARTS INVENTORY</span>
                  <span className="text-[#3fb950] font-semibold">In Stock (Reserved)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#30363d]">
              <button
                onClick={() => setSelectedAlertForWO(null)}
                className="px-3 py-1.5 bg-[#21262d] text-[#c9d1d9] rounded text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConvertToWO(selectedAlertForWO)}
                className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-mono font-semibold shadow"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
