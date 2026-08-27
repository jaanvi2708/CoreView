"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FactoryOverview } from "@/lib/types";
import { injectFaultScenario } from "@/lib/api";
import { useRole, UserRole, ROLES_DATA } from "@/context/RoleContext";
import Navbar from "./Navbar";
import { AlertItem } from "@/lib/types";
import { Activity, Sliders, X, LogOut, User } from "lucide-react";

interface HeaderProps {
  overview?: FactoryOverview | null;
  isConnected: boolean;
  alerts?: AlertItem[];
}

export default function Header({ overview, isConnected, alerts = [] }: HeaderProps) {
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
      {/* CoreView AURA-style Nav Bar — teal industrial theme */}
      <header
        className="sticky top-0 z-40 cv-nav shadow-sm"
        style={{ borderBottom: '1px solid rgba(60,73,71,0.6)', height: 56 }}
      >
        <div className="flex items-center justify-between h-full px-6 gap-4">

          {/* LEFT: CoreView Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              {/* Logo mark */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                style={{ background: 'rgba(89,218,205,0.15)', border: '1px solid rgba(89,218,205,0.4)' }}
              >
                <div className="w-3 h-3 rounded-sm" style={{ background: '#59dacd' }} />
              </div>
              <span
                className="hidden sm:block text-sm font-bold tracking-widest uppercase"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '0.15em',
                  color: '#d4fff8',
                  transition: 'color 0.2s'
                }}
              >
                CoreView
              </span>
            </Link>

            {/* Live stream indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px]"
              style={{
                background: 'rgba(14,21,20,0.8)',
                border: '1px solid rgba(60,73,71,0.6)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'cv-pulse' : ''}`}
                style={{ background: isConnected ? '#6feee1' : '#ffb4ab' }}
              />
              <span style={{ color: isConnected ? '#6feee1' : '#ffb4ab', fontWeight: 700 }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
          <div className="flex-1 flex justify-center">
            <Navbar alerts={alerts} />
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {actionNotice && (
              <span
                className="hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#6feee1',
                  background: 'rgba(111,238,225,0.08)',
                  border: '1px solid rgba(111,238,225,0.25)',
                }}
              >
                <Activity className="w-3 h-3" />
                {actionNotice}
              </span>
            )}

            {/* Clock */}
            <div
              className="hidden xl:block text-[10px] px-2 py-0.5 rounded"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#bbc9c6',
                background: 'rgba(14,21,20,0.8)',
                border: '1px solid rgba(60,73,71,0.6)',
              }}
            >
              {timeStr || '20:25:00 UTC'}
            </div>

            {/* Inject Fault — admin only */}
            {hasPermission('canInjectFaults') && (
              <button
                onClick={() => setInjectModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs btn-interactive"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                  color: '#bbc9c6',
                  background: 'rgba(47,54,53,0.5)',
                  border: '1px solid rgba(60,73,71,0.8)',
                }}
                title="Inject Test Anomaly Scenarios"
              >
                <Sliders className="w-3 h-3" style={{ color: '#ffab67' }} />
                <span className="hidden lg:inline">Inject Fault</span>
              </button>
            )}

            {/* Role / Station Badge */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded btn-interactive"
                style={{
                  background: 'rgba(14,21,20,0.8)',
                  border: '1px solid rgba(60,73,71,0.6)',
                }}
              >
                <User className="w-3.5 h-3.5" style={{ color: '#59dacd' }} />
                <span
                  className="text-[10px] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: '#59dacd' }}
                >
                  {roleInfo.badge}
                </span>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-52 py-1 z-50 rounded-xl shadow-2xl"
                  style={{ background: '#1a2120', border: '1px solid rgba(60,73,71,0.8)' }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(60,73,71,0.6)' }}>
                    <p className="text-[10px] uppercase font-bold" style={{ color: '#bbc9c6', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.06em' }}>Switch Station</p>
                    <p className="text-xs mt-0.5" style={{ color: '#dde4e2', fontFamily: "'Space Grotesk', sans-serif" }}>{roleInfo.userName}</p>
                  </div>
                  {Object.values(ROLES_DATA).map(rd => (
                    <button
                      key={rd.id}
                      onClick={() => handleRoleChange(rd.id)}
                      className="w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: role === rd.id ? '#59dacd' : '#dde4e2',
                        background: 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(47,54,53,0.5)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="truncate">{rd.userName}</span>
                      {role === rd.id && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#59dacd' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Log Out */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs btn-interactive"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#bbc9c6',
                background: 'rgba(47,54,53,0.5)',
                border: '1px solid rgba(60,73,71,0.6)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ffb4ab';
                e.currentTarget.style.borderColor = 'rgba(255,180,171,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#bbc9c6';
                e.currentTarget.style.borderColor = 'rgba(60,73,71,0.6)';
              }}
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fault Injection Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md p-5 rounded-2xl shadow-2xl" style={{ background: '#1a2120', border: '1px solid rgba(60,73,71,0.8)' }}>
            <div className="flex justify-between items-center pb-3 mb-4" style={{ borderBottom: '1px solid rgba(60,73,71,0.6)' }}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" style={{ color: '#59dacd' }} />
                <h3 className="text-sm font-bold uppercase" style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#dde4e2', letterSpacing: '0.05em' }}>
                  Fault Scenario Injector
                </h3>
              </div>
              <button onClick={() => setInjectModalOpen(false)} style={{ color: '#bbc9c6' }} className="btn-interactive">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#bbc9c6' }}>
              Inject synthetic faults to evaluate SCADA alarms, 3D Digital Twin hotspots, and AI prescriptive response.
            </p>
            <div className="space-y-3 text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
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
                  <label className="block mb-1" style={{ color: '#bbc9c6', letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</label>
                  <select value={s.value} onChange={e => s.onChange(e.target.value)} className="w-full rounded-lg p-2" style={{ background: '#0e1514', border: '1px solid rgba(60,73,71,0.8)', color: '#dde4e2' }}>
                    {s.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block mb-1" style={{ color: '#bbc9c6', letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>INTENSITY MAGNITUDE ({magnitude})</label>
                <input type="range" min="1" max="5" step="0.5" value={magnitude} onChange={e => setMagnitude(Number(e.target.value))} className="w-full" style={{ accentColor: '#59dacd' }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-3" style={{ borderTop: '1px solid rgba(60,73,71,0.6)' }}>
              <button onClick={() => setInjectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs btn-interactive" style={{ background: 'rgba(47,54,53,0.5)', color: '#dde4e2', border: '1px solid rgba(60,73,71,0.6)', fontFamily: "'Space Grotesk',sans-serif" }}>Cancel</button>
              <button onClick={handleInjectFault} className="px-4 py-1.5 rounded-lg text-xs font-semibold shadow btn-interactive" style={{ background: '#ffb4ab', color: '#690005', fontFamily: "'Space Grotesk',sans-serif" }}>Inject Fault</button>
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
