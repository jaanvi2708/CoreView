"use client";

import React, { useState } from "react";
import { useRole, AUTH_ACCOUNTS, ROLES_DATA, UserRole } from "@/context/RoleContext";
import { Lock, ShieldCheck, User, KeyRound, AlertTriangle, Cpu, Eye, EyeOff, ChevronRight, Activity, BarChart3, Package, Warehouse, Zap, ClipboardCheck } from "lucide-react";

// Role-specific portal configurations
const ROLE_PORTALS = {
  admin: {
    id: "admin",
    accent: "#388bfd",
    accentGlow: "rgba(56,139,253,0.15)",
    accentBorder: "rgba(56,139,253,0.4)",
    gradient: "from-[#0d1117] via-[#0d1420] to-[#0d1117]",
    label: "GLOBAL ADMIN PORTAL",
    subtitle: "Enterprise Command — Unrestricted SCADA Authority",
    badge: "CLEARANCE LEVEL 4",
    badgeColor: "text-[#388bfd] border-[#388bfd]/50 bg-[#388bfd]/10",
    icon: ShieldCheck,
    statsPreview: ["5 Zones Active", "18 Machines Online", "Full Financial Access", "AI Model Control"],
    accentText: "text-[#58a6ff]",
  },
  production_lead: {
    id: "production_lead",
    accent: "#3fb950",
    accentGlow: "rgba(63,185,80,0.12)",
    accentBorder: "rgba(63,185,80,0.35)",
    gradient: "from-[#0d1117] via-[#0d1a0e] to-[#0d1117]",
    label: "ZONE 01 — PRODUCTION PORTAL",
    subtitle: "CNC Milling • Hydraulic Press • Robotic Cell Operations",
    badge: "CLEARANCE LEVEL 2",
    badgeColor: "text-[#3fb950] border-[#3fb950]/50 bg-[#3fb950]/10",
    icon: Activity,
    statsPreview: ["4 CNC Assets", "1 Robotic Cell", "Real-Time RUL", "Work Order Dispatch"],
    accentText: "text-[#3fb950]",
  },
  packaging_tech: {
    id: "packaging_tech",
    accent: "#e3b341",
    accentGlow: "rgba(227,179,65,0.12)",
    accentBorder: "rgba(227,179,65,0.35)",
    gradient: "from-[#0d1117] via-[#1a1600] to-[#0d1117]",
    label: "ZONE 02 — PACKAGING PORTAL",
    subtitle: "Flow Wrapper • Gantry Palletizer • Cartoner Line",
    badge: "CLEARANCE LEVEL 2",
    badgeColor: "text-[#e3b341] border-[#e3b341]/50 bg-[#e3b341]/10",
    icon: Package,
    statsPreview: ["Flow Wrapper WRP-01", "Gantry PLT-01", "Cartoner CRT-01", "Line Throughput KPIs"],
    accentText: "text-[#e3b341]",
  },
  warehouse_lead: {
    id: "warehouse_lead",
    accent: "#79c0ff",
    accentGlow: "rgba(121,192,255,0.12)",
    accentBorder: "rgba(121,192,255,0.35)",
    gradient: "from-[#0d1117] via-[#0a1420] to-[#0d1117]",
    label: "ZONE 03 — LOGISTICS PORTAL",
    subtitle: "AS/RS Stacker Cranes • AGV Fleet • Conveyor Network",
    badge: "CLEARANCE LEVEL 2",
    badgeColor: "text-[#79c0ff] border-[#79c0ff]/50 bg-[#79c0ff]/10",
    icon: Warehouse,
    statsPreview: ["ASRS-01 & ASRS-02", "AGV-01 Fleet", "Conveyor CNV-01", "High-Bay Status"],
    accentText: "text-[#79c0ff]",
  },
  utilities_eng: {
    id: "utilities_eng",
    accent: "#f78166",
    accentGlow: "rgba(247,129,102,0.12)",
    accentBorder: "rgba(247,129,102,0.35)",
    gradient: "from-[#0d1117] via-[#1a0e0d] to-[#0d1117]",
    label: "ZONE 04 — UTILITIES PORTAL",
    subtitle: "Compressors • Chiller • Boiler • Power Substation",
    badge: "CLEARANCE LEVEL 3",
    badgeColor: "text-[#f78166] border-[#f78166]/50 bg-[#f78166]/10",
    icon: Zap,
    statsPreview: ["CMP-01 Compressor", "CHL-01 Chiller", "BLR-01 Boiler", "MW Grid Monitoring"],
    accentText: "text-[#f78166]",
  },
  quality_analyst: {
    id: "quality_analyst",
    accent: "#bc8cff",
    accentGlow: "rgba(188,140,255,0.12)",
    accentBorder: "rgba(188,140,255,0.35)",
    gradient: "from-[#0d1117] via-[#150d1a] to-[#0d1117]",
    label: "ZONE 05 — QUALITY PORTAL",
    subtitle: "AI Vision Gantry • Laser Metrology • ISO Compliance",
    badge: "CLEARANCE LEVEL 3",
    badgeColor: "text-[#bc8cff] border-[#bc8cff]/50 bg-[#bc8cff]/10",
    icon: ClipboardCheck,
    statsPreview: ["VSN-01 4K Vision", "LSR-01 Metrology", "ISO 9001 QC Feed", "Defect Analytics"],
    accentText: "text-[#bc8cff]",
  },
};

// Map username → default portal type
const QUICK_LOGINS = [
  { username: "admin",  role: "admin",           label: "System Admin",        zone: "All Zones" },
  { username: "op01",   role: "production_lead",  label: "Production Operator", zone: "Z01 Production" },
  { username: "op02",   role: "packaging_tech",   label: "Packaging Tech",      zone: "Z02 Packaging" },
  { username: "op03",   role: "warehouse_lead",   label: "Logistics Operator",  zone: "Z03 Logistics" },
  { username: "eng04",  role: "utilities_eng",    label: "Utilities Engineer",  zone: "Z04 Utilities" },
  { username: "qa05",   role: "quality_analyst",  label: "QA Analyst",          zone: "Z05 Quality" },
];

function detectRole(username: string): UserRole | null {
  const acc = AUTH_ACCOUNTS.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
  return acc ? acc.role : null;
}

export default function LoginPage() {
  const { login } = useRole();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Detect portal variant from username input live
  const detectedRole = detectRole(username) as UserRole | null;
  const portal = detectedRole ? ROLE_PORTALS[detectedRole] : null;
  const PortalIcon = portal?.icon || Cpu;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMsg(res.error || "Authentication failed. Verify credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string) => {
    setUsername(u);
    setPassword("factory123");
    setErrorMsg(null);
    setLoading(true);
    await login(u, "factory123");
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex bg-[#0d1117] bg-gradient-to-br ${portal?.gradient || "from-[#0d1117] to-[#0d1117]"} transition-all duration-500 relative overflow-hidden`}>
      {/* Background decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Ambient glow based on role */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none transition-all duration-700"
        style={{ background: portal?.accentGlow || "rgba(56,139,253,0.06)" }}
      />

      {/* LEFT PANEL — Role Portal Info */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10">
        {/* CoreView Branding */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border"
              style={{ borderColor: portal?.accentBorder || "rgba(56,139,253,0.4)", background: portal?.accentGlow || "rgba(56,139,253,0.1)" }}
            >
              <PortalIcon className="w-5 h-5" style={{ color: portal?.accent || "#58a6ff" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold font-mono tracking-widest text-[#f0f6fc] uppercase">CoreView</h1>
              <p className="text-[10px] font-mono text-[#8b949e]">Predictive Maintenance & SCADA Platform</p>
            </div>
          </div>

          {portal ? (
            <div className="space-y-6">
              <div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border inline-block mb-3 ${portal.badgeColor}`}
                >
                  {portal.badge}
                </span>
                <h2 className="text-2xl font-bold font-mono text-[#f0f6fc] uppercase leading-tight">
                  {portal.label}
                </h2>
                <p className="text-sm text-[#8b949e] font-mono mt-2 leading-relaxed">
                  {portal.subtitle}
                </p>
              </div>

              {/* Preview stats for this role */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {portal.statsPreview.map((stat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border bg-[#161b22]/60 backdrop-blur-sm"
                    style={{ borderColor: portal.accentBorder }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: portal.accent }} />
                      <span className="text-xs font-mono text-[#c9d1d9]">{stat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Default / no portal selected
            <div className="space-y-5">
              <h2 className="text-2xl font-bold font-mono text-[#f0f6fc] uppercase leading-tight">
                Authorized Personnel Only
              </h2>
              <p className="text-sm text-[#8b949e] font-mono leading-relaxed">
                CoreView SCADA controls 24/7 industrial operations. Each station has dedicated access scoped to their assigned plant zone and machinery.
              </p>
              <div className="space-y-2.5 mt-4">
                {QUICK_LOGINS.map((q) => {
                  const p = ROLE_PORTALS[q.role as UserRole];
                  const QIcon = p.icon;
                  return (
                    <div key={q.username} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#21262d] bg-[#161b22]/50">
                      <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: p.accentGlow, borderColor: p.accentBorder }}>
                        <QIcon className="w-3.5 h-3.5" style={{ color: p.accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-semibold text-[#c9d1d9]">{q.label}</p>
                        <p className="text-[10px] font-mono text-[#8b949e]">{q.zone}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#484f58]" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom ISO compliance footer */}
        <div className="text-[10px] font-mono text-[#484f58] space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043]" />
            <span>TLS 1.3 Encrypted Session</span>
          </div>
          <div>ISO 13374 SCADA Standard • CoreView v3.2 Enterprise</div>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-xl font-bold font-mono tracking-widest text-[#f0f6fc] uppercase">CoreView</h1>
            <p className="text-xs text-[#8b949e] font-mono">Predictive Maintenance & SCADA Platform</p>
          </div>

          <div
            className="bg-[#161b22]/90 backdrop-blur-md border rounded-xl p-6 md:p-8 shadow-2xl space-y-5 transition-all duration-500"
            style={{ borderColor: portal?.accentBorder || "#30363d" }}
          >
            {/* Form Header */}
            <div className="border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2 mb-1">
                {portal ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${portal.badgeColor}`}
                  >
                    {portal.badge}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-[#8b949e] border-[#30363d] bg-[#21262d]">
                    SELECT STATION
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-wide">
                {portal ? portal.label : "Station Authentication"}
              </h2>
              <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                {portal ? portal.subtitle : "Enter your station credentials below"}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#da3633]/12 border border-[#da3633]/40 text-[#f85149] text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#8b949e] mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Station Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8b949e] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => { setUsername(e.target.value); setErrorMsg(null); }}
                    placeholder="admin, op01, op02, eng04…"
                    className="w-full bg-[#0d1117] border focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-[#f0f6fc] text-xs font-mono transition-all"
                    style={{ borderColor: portal ? portal.accentBorder : "#30363d" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8b949e] mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Security PIN / Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8b949e] absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="factory123 (default)"
                    className="w-full bg-[#0d1117] border focus:outline-none rounded-lg pl-9 pr-10 py-2.5 text-[#f0f6fc] text-xs font-mono transition-all"
                    style={{ borderColor: portal ? portal.accentBorder : "#30363d" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white font-mono font-semibold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 mt-1"
                style={{
                  background: portal?.accent || "#238636",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: portal ? `0 0 20px ${portal.accentGlow}` : "none"
                }}
              >
                {loading ? (
                  <span>Authenticating…</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{portal ? `Enter ${portal.label.split("—")[0].trim()}` : "Authorize & Enter"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Station Login */}
            <div className="pt-4 border-t border-[#30363d]">
              <p className="text-[10px] font-mono text-[#8b949e] uppercase font-bold tracking-wider mb-2.5">
                Quick Station Login (Demo):
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_LOGINS.map((q) => {
                  const p = ROLE_PORTALS[q.role as UserRole];
                  return (
                    <button
                      key={q.username}
                      type="button"
                      onClick={() => handleQuickLogin(q.username)}
                      className="p-2 rounded-lg border border-[#21262d] bg-[#0d1117] hover:border-current text-left transition-all group"
                      style={{
                        "--hover-border": p.accentBorder,
                      } as React.CSSProperties}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = p.accentBorder)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#21262d")}
                    >
                      <p className="text-[10px] font-mono font-bold text-[#c9d1d9] truncate">{q.label}</p>
                      <p className="text-[9px] font-mono mt-0.5" style={{ color: p.accent }}>{q.zone}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
