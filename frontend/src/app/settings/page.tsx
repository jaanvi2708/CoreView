"use client";

import React, { useState, useEffect } from "react";
import StatusBadge from "@/components/common/StatusBadge";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import { useRole } from "@/context/RoleContext";
import { fetchSettings } from "@/lib/api";
import { Settings, Sliders, CheckCircle2, Lock } from "lucide-react";

export default function SettingsPage() {
  const { role, roleInfo, hasPermission } = useRole();
  const [settings, setSettings] = useState<any>({
    factory_name: "Apex Advanced Smart Manufacturing Facility (Plant 04)",
    shift: "Shift 2 (Afternoon / Evening 14:00 - 22:00)",
    active_role: "[STATION-OP]",
    klaxon_alarm_enabled: true,
    sms_dispatch_enabled: true,
    email_alerts_enabled: true,
    auto_wo_threshold: "CRITICAL",
    vibration_warn_threshold_mms: 2.8,
    vibration_crit_threshold_mms: 4.5,
    temp_warn_threshold_c: 75.0,
    temp_crit_threshold_c: 90.0,
    retraining_schedule: "Weekly Automatic (Sunday 02:00 AM)",
    ai_sensitivity: "Medium-High (0.85 F1 optimization)"
  });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings().then(s => setSettings(s));
  }, []);

  const handleSave = () => {
    if (!hasPermission("canCalibrateThresholds")) {
      setSavedNotice("Unauthorized: Level 4 (System Admin) clearance required to alter ISO threshold limits.");
      setTimeout(() => setSavedNotice(null), 4000);
      return;
    }
    setSavedNotice("Settings and sensor alarm thresholds calibrated successfully!");
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              SCADA Configuration & Asset Hierarchy Settings
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-0.5">
            Sensor Alarm Thresholds • Asset Tree Calibration • Role Governance • AI Retraining Schedules
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasPermission("canCalibrateThresholds")}
          className={`px-4 py-2 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
            hasPermission("canCalibrateThresholds")
              ? "bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm"
              : "bg-[#21262d] text-[#484f58] border border-[#30363d] cursor-not-allowed"
          }`}
          title={hasPermission("canCalibrateThresholds") ? "Save Changes" : "Requires Level 4 Admin clearance"}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Save Calibrations</span>
          {!hasPermission("canCalibrateThresholds") && <Lock className="w-3 h-3 text-[#484f58]" />}
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 rounded bg-[#21262d] border border-[#388bfd] text-[#58a6ff] text-xs font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Sensor Threshold Calibration */}
        <div className="scada-card p-4 space-y-4 bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Global Sensor Alarm Calibration (ISO 10816-3)
            </h3>
            {!hasPermission("canCalibrateThresholds") && (
              <span className="text-[10px] font-mono text-[#8b949e] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#e3b341]" /> Read-Only
              </span>
            )}
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[#c9d1d9] mb-1">
                <span>VIBRATION WARNING THRESHOLD (RMS)</span>
                <strong className="text-[#e3b341]">{settings.vibration_warn_threshold_mms} mm/s</strong>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                disabled={!hasPermission("canCalibrateThresholds")}
                value={settings.vibration_warn_threshold_mms}
                onChange={e => setSettings({ ...settings, vibration_warn_threshold_mms: Number(e.target.value) })}
                className="w-full accent-[#d29922]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#c9d1d9] mb-1">
                <span>VIBRATION CRITICAL / SHUTDOWN (RMS)</span>
                <strong className="text-[#f85149]">{settings.vibration_crit_threshold_mms} mm/s</strong>
              </div>
              <input
                type="range"
                min="3.5"
                max="8.0"
                step="0.1"
                disabled={!hasPermission("canCalibrateThresholds")}
                value={settings.vibration_crit_threshold_mms}
                onChange={e => setSettings({ ...settings, vibration_crit_threshold_mms: Number(e.target.value) })}
                className="w-full accent-[#da3633]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#c9d1d9] mb-1">
                <span>BEARING TEMPERATURE WARNING</span>
                <strong className="text-[#e3b341]">{settings.temp_warn_threshold_c}°C</strong>
              </div>
              <input
                type="range"
                min="60"
                max="90"
                step="1"
                disabled={!hasPermission("canCalibrateThresholds")}
                value={settings.temp_warn_threshold_c}
                onChange={e => setSettings({ ...settings, temp_warn_threshold_c: Number(e.target.value) })}
                className="w-full accent-[#d29922]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#c9d1d9] mb-1">
                <span>BEARING TEMPERATURE CRITICAL / LOTO</span>
                <strong className="text-[#f85149]">{settings.temp_crit_threshold_c}°C</strong>
              </div>
              <input
                type="range"
                min="80"
                max="120"
                step="1"
                disabled={!hasPermission("canCalibrateThresholds")}
                value={settings.temp_crit_threshold_c}
                onChange={e => setSettings({ ...settings, temp_crit_threshold_c: Number(e.target.value) })}
                className="w-full accent-[#da3633]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Notification & Dispatch Routing */}
        <div className="scada-card p-4 space-y-4 bg-[#161b22]">
          <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase border-b border-[#30363d] pb-2">
            Alarm Routing & Automated Dispatch Rules
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
              <div>
                <strong className="text-[#c9d1d9] block">SCADA Klaxon Control Room Audio</strong>
                <span className="text-[10px] text-[#8b949e]">Audible buzzer for Severity: CRITICAL</span>
              </div>
              <input
                type="checkbox"
                checked={settings.klaxon_alarm_enabled}
                onChange={e => setSettings({ ...settings, klaxon_alarm_enabled: e.target.checked })}
                className="accent-[#388bfd] w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
              <div>
                <strong className="text-[#c9d1d9] block">SMS Pager Dispatch to On-Duty Tech</strong>
                <span className="text-[10px] text-[#8b949e]">Direct cellular alert to Level III millwright</span>
              </div>
              <input
                type="checkbox"
                checked={settings.sms_dispatch_enabled}
                onChange={e => setSettings({ ...settings, sms_dispatch_enabled: e.target.checked })}
                className="accent-[#388bfd] w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
              <div>
                <strong className="text-[#c9d1d9] block">Automated Work Order Generation</strong>
                <span className="text-[10px] text-[#8b949e]">Trigger on alarms exceeding severity threshold</span>
              </div>
              <select
                value={settings.auto_wo_threshold}
                onChange={e => setSettings({ ...settings, auto_wo_threshold: e.target.value })}
                className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded px-2 py-1 text-xs"
              >
                <option value="CRITICAL">CRITICAL Only</option>
                <option value="WARNING">WARNING & CRITICAL</option>
                <option value="MANUAL">Manual Review Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Asset Hierarchy Tree */}
        <div className="scada-card p-4 space-y-3 lg:col-span-2 bg-[#161b22]">
          <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase border-b border-[#30363d] pb-2">
            Plant Asset Hierarchy (Factory → Zone → Machine → Digital Twin Components)
          </h3>

          <div className="p-3 bg-[#0d1117] rounded border border-[#30363d] font-mono text-xs space-y-2 text-[#c9d1d9]">
            <div className="text-[#58a6ff] font-bold">[FACILITY] {settings.factory_name}</div>
            <div className="pl-4 space-y-1 text-[11px] text-[#8b949e]">
              <div>├── [ZONE 01] Production & Machining (CNC-01, CNC-02, PRS-01, ROB-01)</div>
              <div>├── [ZONE 02] Packaging & Bottling (WRP-01, PLT-01, CRT-01)</div>
              <div>├── [ZONE 03] Warehouse & Logistics (ASRS-01, ASRS-02, CNV-01, AGV-01)</div>
              <div>├── [ZONE 04] Utilities & Power (CMP-01, CMP-02, CHL-01, BLR-01, TX-01)</div>
              <div>└── [ZONE 05] Quality Assurance & Metrology (VSN-01, LSR-01)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
