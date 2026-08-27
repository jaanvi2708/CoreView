"use client";

import React from "react";
import Link from "next/link";
import { FactoryOverview } from "@/lib/types";
import Navbar from "./Navbar";
import { AlertItem } from "@/lib/types";

interface HeaderProps {
  overview?: FactoryOverview | null;
  isConnected: boolean;
  alerts?: AlertItem[];
}

export default function Header({ overview, isConnected, alerts = [] }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 cv-nav shadow-sm"
      style={{ borderBottom: '1px solid rgba(60,73,71,0.6)', height: 56 }}
    >
      <div className="flex items-center justify-between h-full px-6 gap-4">

        {/* LEFT: CoreView Logo & Live Stream Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
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

        {/* RIGHT: Minimal System Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
            style={{
              color: '#8b949e',
              background: 'rgba(14,21,20,0.6)',
              border: '1px solid rgba(60,73,71,0.4)',
            }}
          >
            SCADA v2.0
          </span>
        </div>

      </div>
    </header>
  );
}
