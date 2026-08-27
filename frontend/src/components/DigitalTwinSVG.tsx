"use client";

import React from "react";

interface Props {
  vibration: number;
  temperature: number;
  health: "Healthy" | "Warning" | "Critical";
}

export default function DigitalTwinSVG({ vibration, temperature, health }: Props) {
  // Map health to industrial colors
  const color = 
    health === "Healthy" ? "#10b981" : // Emerald
    health === "Warning" ? "#f59e0b" : // Amber
    "#ef4444"; // Rose

  return (
    <div className="relative w-full max-w-2xl mx-auto border border-slate-700 bg-slate-900 rounded-lg p-6 shadow-2xl">
      <h3 className="text-slate-300 text-lg font-mono mb-4 uppercase tracking-widest">Live Digital Twin: Heavy Compressor</h3>
      
      {/* 
        This is a stylized 2D schematic of a compressor unit. 
        In a real application, this would be exported from CAD software to SVG.
      */}
      <svg viewBox="0 0 800 400" className="w-full h-auto drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="pipe" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        
        {/* Base Plate */}
        <rect x="50" y="320" width="700" height="20" fill="url(#metal)" rx="4" />
        
        {/* Main Motor Body */}
        <rect x="100" y="150" width="250" height="170" fill="url(#metal)" rx="10" />
        {/* Motor Ribs (Cooling fins) */}
        {[...Array(8)].map((_, i) => (
          <line key={i} x1="120" y1={170 + i * 18} x2="330" y2={170 + i * 18} stroke="#0f172a" strokeWidth="4" />
        ))}
        
        {/* Shaft connecting Motor to Pump */}
        <rect x="350" y="210" width="80" height="30" fill="url(#pipe)" />
        {/* Highlight shaft if vibration is high */}
        {vibration > 1.0 && (
          <circle cx="390" cy="225" r="30" fill="none" stroke="#ef4444" strokeWidth="3" className="animate-ping opacity-75" />
        )}
        
        {/* Pump Casing (Volute) */}
        <circle cx="530" cy="225" r="95" fill="url(#metal)" />
        <circle cx="530" cy="225" r="50" fill="#334155" />
        
        {/* Discharge Pipe */}
        <path d="M 530 130 L 530 50 L 700 50 L 700 80 L 560 80 L 560 130 Z" fill="url(#pipe)" />
        
        {/* Suction Pipe */}
        <path d="M 625 225 L 750 225 L 750 255 L 625 255 Z" fill="url(#pipe)" />

        {/* Dynamic Health Indicator on Motor */}
        <circle cx="225" cy="110" r="15" fill={color} className="animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
        <text x="225" y="115" fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">STATUS</text>

        {/* Temperature Sensor Callout */}
        <g transform="translate(180, 50)">
          <line x1="45" y1="60" x2="100" y2="10" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
          <rect x="90" y="-15" width="90" height="30" fill="#0f172a" stroke="#475569" rx="4" />
          <text x="135" y="5" fill="#e2e8f0" fontSize="14" textAnchor="middle" fontFamily="monospace">
            {temperature.toFixed(1)}°C
          </text>
        </g>
        
        {/* Vibration Sensor Callout */}
        <g transform="translate(380, 310)">
          <line x1="10" y1="-85" x2="60" y2="-20" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
          <rect x="50" y="-20" width="100" height="30" fill="#0f172a" stroke="#475569" rx="4" />
          <text x="100" y="0" fill="#e2e8f0" fontSize="14" textAnchor="middle" fontFamily="monospace">
            {vibration.toFixed(2)} mm/s
          </text>
        </g>
      </svg>
    </div>
  );
}
