"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertItem } from "@/lib/types";
import { LayoutDashboard, Layers, Cpu, ShieldAlert, FileSpreadsheet, Settings, Menu, X } from "lucide-react";

interface NavbarProps {
  alerts?: AlertItem[];
}

export default function Navbar({ alerts = [] }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unackAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === "CRITICAL" && !a.acknowledged).length;

  const navItems = [
    { label: "Overview",       href: "/",                   icon: LayoutDashboard },
    { label: "Digital Twins",  href: "/digital-twins",      icon: Layers },
    { label: "AI Command",     href: "/ai-command",         icon: Cpu },
    { label: "Alerts",         href: "/alerts-work-orders", icon: ShieldAlert, badgeCount: unackAlertsCount, isCritical: criticalCount > 0 },
    { label: "Reports",        href: "/reports",            icon: FileSpreadsheet },
    { label: "Settings",       href: "/settings",           icon: Settings },
  ];

  return (
    <>
      {/* Desktop Nav — Space Grotesk, teal active underline */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all btn-interactive"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: active ? 600 : 500,
                color: active ? '#d4fff8' : '#bbc9c6',
                background: active ? 'rgba(89,218,205,0.08)' : 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = '#dde4e2';
                  e.currentTarget.style.background = 'rgba(47,54,53,0.5)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = '#bbc9c6';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: active ? '#59dacd' : '#bbc9c6' }}
              />
              <span>{item.label}</span>

              {/* Alert badge */}
              {item.badgeCount && item.badgeCount > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    background: item.isCritical ? '#ffb4ab' : 'rgba(255,171,103,0.15)',
                    color: item.isCritical ? '#690005' : '#ffab67',
                    fontWeight: 700,
                  }}
                >
                  {item.badgeCount}
                </span>
              )}

              {/* Active underline indicator */}
              {active && (
                <span
                  className="absolute -bottom-[5px] left-3 right-3 h-[2px] rounded-t-full"
                  style={{ background: '#59dacd' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Toggle */}
      <button
        className="md:hidden p-1.5 rounded-lg btn-interactive"
        style={{ background: 'rgba(47,54,53,0.5)', border: '1px solid rgba(60,73,71,0.6)', color: '#bbc9c6' }}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed top-[56px] left-0 right-0 z-50 p-3 space-y-1 shadow-2xl"
          style={{ background: 'rgba(26,33,32,0.97)', borderBottom: '1px solid rgba(60,73,71,0.8)', backdropFilter: 'blur(20px)' }}
        >
          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: active ? 600 : 400,
                  color: active ? '#d4fff8' : '#bbc9c6',
                  background: active ? 'rgba(89,218,205,0.08)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: active ? '#59dacd' : '#bbc9c6' }} />
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 && (
                  <span
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: item.isCritical ? '#ffb4ab' : 'rgba(255,171,103,0.15)',
                      color: item.isCritical ? '#690005' : '#ffab67',
                    }}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
