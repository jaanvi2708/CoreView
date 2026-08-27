"use client";

import React, { useState, useEffect } from "react";
import { useRole, UserRole, ROLES_DATA } from "@/context/RoleContext";
import { injectFaultScenario } from "@/lib/api";
import { 
  Clock, 
  Sliders, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  X, 
  Activity,
  SlidersHorizontal
} from "lucide-react";

export default function Sidebar() {
  const { role, roleInfo, setRole, hasPermission, logout } = useRole();

  const [timeStr, setTimeStr] = useState<string>("");
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("cmp-01");
  const [faultType, setFaultType] = useState("vibration_spike");
  const [magnitude, setMagnitude] = useState(2.5);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString("en-US", { hour12: false }) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setActionNotice(`Switched to: ${ROLES_DATA[newRole].badge}`);
    setTimeout(() => setActionNotice(null), 3000);
    setProfileOpen(false);
  };

  const handleInjectFault = async () => {
    if (!hasPermission("canInjectFaults")) {
      setActionNotice("Access Denied: Requires Admin clearance.");
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    await injectFaultScenario(selectedAsset, faultType, magnitude);
    setInjectModalOpen(false);
    setActionNotice(`Injected fault: ${faultType} on ${selectedAsset.toUpperCase()}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <>
      {/* Left-Side Control Panel — strictly housing UTC, Inject Fault, Global Admin, and Log Out */}
      <aside className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between shrink-0 min-h-[calc(100vh-56px)] p-3 transition-all duration-200">
        
        {/* Top Header Label */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#30363d]/60">
            <SlidersHorizontal className="w-4 h-4 text-[#59dacd]" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#bbc9c6] uppercase">
              Control Panel
            </span>
          </div>

          {/* Toast Notification for actions */}
          {actionNotice && (
            <div className="text-[10px] p-2 rounded-lg font-mono bg-[#6feee1]/10 border border-[#6feee1]/30 text-[#6feee1] flex items-center gap-1.5 animate-pulse">
              <Activity className="w-3 h-3 shrink-0" />
              <span className="truncate">{actionNotice}</span>
            </div>
          )}

          {/* 1. UTC Clock Box */}
          <div className="p-3 rounded-xl bg-[#0e1514] border border-[#3c4947]/70 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#59dacd] uppercase tracking-wider font-mono">
              <Clock className="w-3.5 h-3.5 text-[#59dacd]" />
              <span>UTC Time</span>
            </div>
            <div className="text-sm font-extrabold font-mono text-[#dde4e2] tracking-wider">
              {timeStr || "23:48:00 UTC"}
            </div>
          </div>

          {/* 2. Inject Fault Button */}
          {hasPermission("canInjectFaults") && (
            <button
              onClick={() => setInjectModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-mono text-xs transition-all btn-interactive shadow-sm"
              style={{
                color: "#ffab67",
                background: "rgba(255,171,103,0.12)",
                border: "1px solid rgba(255,171,103,0.35)",
              }}
              title="Inject Test Anomaly Scenarios"
            >
              <Sliders className="w-4 h-4 text-[#ffab67] shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide">Inject Fault</span>
            </button>
          )}

          {/* 3. Global Admin / Clearance Selector */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl font-mono text-xs transition-all btn-interactive"
              style={{
                background: "rgba(14,21,20,0.9)",
                border: "1px solid rgba(89,218,205,0.35)",
              }}
              title={`Role: ${roleInfo.badge}`}
            >
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-[#59dacd] shrink-0" />
                <div className="text-left truncate">
                  <div className="text-[10px] font-bold text-[#59dacd] uppercase tracking-wider truncate">
                    {roleInfo.badge}
                  </div>
                  <div className="text-[9px] text-[#bbc9c6] truncate">{roleInfo.userName}</div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-[#59dacd] transition-transform shrink-0 ${profileOpen ? "rotate-90" : ""}`} />
            </button>

            {/* Role Clearance Selector Popover */}
            {profileOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-full py-1.5 rounded-xl shadow-2xl bg-[#1a2120] border border-[#3c4947]/80 z-50">
                <div className="px-3 py-2 border-b border-[#3c4947]/60">
                  <p className="text-[10px] uppercase font-bold text-[#bbc9c6] tracking-wider">Switch Portal Clearance</p>
                  <p className="text-xs text-[#dde4e2] font-semibold mt-0.5">{roleInfo.userName}</p>
                </div>
                {Object.values(ROLES_DATA).map(rd => (
                  <button
                    key={rd.id}
                    onClick={() => handleRoleChange(rd.id)}
                    className="w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors hover:bg-[#2f3635]/60"
                    style={{
                      color: role === rd.id ? '#59dacd' : '#dde4e2',
                    }}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{rd.userName}</div>
                      <div className="text-[9px] text-[#8b949e] font-mono">{rd.badge}</div>
                    </div>
                    {role === rd.id && <span className="w-2 h-2 rounded-full bg-[#59dacd] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Log Out Button at Bottom */}
        <div className="pt-3 border-t border-[#30363d]">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-mono text-xs transition-all btn-interactive"
            style={{
              color: "#bbc9c6",
              background: "rgba(47,54,53,0.5)",
              border: "1px solid rgba(60,73,71,0.6)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffb4ab';
              e.currentTarget.style.borderColor = 'rgba(255,180,171,0.4)';
              e.currentTarget.style.background = 'rgba(255,180,171,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#bbc9c6';
              e.currentTarget.style.borderColor = 'rgba(60,73,71,0.6)';
              e.currentTarget.style.background = 'rgba(47,54,53,0.5)';
            }}
            title="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wide">Log Out</span>
          </button>
        </div>

      </aside>

      {/* Fault Injection Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl shadow-2xl bg-[#1a2120] border border-[#3c4947]/80">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#3c4947]/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#59dacd]" />
                <h3 className="text-sm font-bold uppercase text-[#dde4e2] tracking-wide font-mono">
                  Fault Scenario Injector
                </h3>
              </div>
              <button onClick={() => setInjectModalOpen(false)} className="text-[#bbc9c6] hover:text-white btn-interactive">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mb-4 text-[#bbc9c6]">
              Inject synthetic faults to evaluate SCADA alarms, 3D Digital Twin hotspots, and AI prescriptive response.
            </p>
            <div className="space-y-3 text-xs font-mono">
              {[
                { label: 'TARGET INDUSTRIAL ASSET', id: 'asset', value: selectedAsset, onChange: (v: string) => setSelectedAsset(v), options: [
                  ['cmp-01','CMP-01: Centrifugal Air Compressor'],
                  ['cnc-01','CNC-01: 5-Axis Milling Center'],
                  ['wrp-01','WRP-01: Flow Packaging Wrapper'],
                  ['asrs-01','ASRS-01: High-Bay Stacker Crane'],
                  ['chl-01','CHL-01: Industrial Chiller 500TR'],
                ]},
                { label: 'FAULT PHENOMENON', id: 'fault', value: faultType, onChange: (v: string) => setFaultType(v), options: [
                  ['vibration_spike','Bearing Outer Race Spall & Vibration Spike'],
                  ['temp_spike','Stator Winding Overheat & Thermal Runaway'],
                  ['load_mod','Transient Dynamic Overload (+35%)'],
                ]},
              ].map(s => (
                <div key={s.id}>
                  <label className="block mb-1 text-[#bbc9c6] tracking-wider text-[10px] uppercase font-bold">{s.label}</label>
                  <select value={s.value} onChange={e => s.onChange(e.target.value)} className="w-full rounded-lg p-2 bg-[#0e1514] border border-[#3c4947]/80 text-[#dde4e2]">
                    {s.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block mb-1 text-[#bbc9c6] tracking-wider text-[10px] uppercase font-bold">INTENSITY MAGNITUDE ({magnitude})</label>
                <input type="range" min="1" max="5" step="0.5" value={magnitude} onChange={e => setMagnitude(Number(e.target.value))} className="w-full accent-[#59dacd]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-[#3c4947]/60">
              <button onClick={() => setInjectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs btn-interactive bg-[#2f3635]/50 text-[#dde4e2] border border-[#3c4947]/60">Cancel</button>
              <button onClick={handleInjectFault} className="px-4 py-1.5 rounded-lg text-xs font-semibold shadow btn-interactive bg-[#ffb4ab] text-[#690005]">Inject Fault</button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}
