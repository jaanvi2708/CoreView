import React from "react";

interface GaugeProps {
  value: number; // 0 to 100
  title: string;
  unit?: string;
  size?: number;
  warnThreshold?: number;
  critThreshold?: number;
  subtitle?: string;
}

export default function Gauge({
  value,
  title,
  unit = "%",
  size = 140,
  warnThreshold = 75,
  critThreshold = 45,
  subtitle
}: GaugeProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, value))) / 100;

  // Color mapping
  let strokeColor = "#10b981"; // Emerald
  if (value < critThreshold) {
    strokeColor = "#ef4444"; // Rose
  } else if (value < warnThreshold) {
    strokeColor = "#f59e0b"; // Amber
  }

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-135">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Value in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-light font-mono-nums text-slate-100 leading-none">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">{unit}</span>
        </div>
      </div>

      <div className="mt-1 text-center">
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
          {title}
        </span>
        {subtitle && (
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
