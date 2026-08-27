"use client";

import React, { useEffect, useRef } from "react";

interface OscilloscopeProps {
  dataPoints: number[];
  label: string;
  unit: string;
  currentValue: number;
  warnThreshold?: number;
  critThreshold?: number;
  lineColor?: string;
  height?: number;
}

export default function OscilloscopeChart({
  dataPoints,
  label,
  unit,
  currentValue,
  warnThreshold,
  critThreshold,
  lineColor = "#388bfd",
  height = 110
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    // Clear with neutral dark SCADA background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, width, h);

    // Draw technical hairline grid lines
    ctx.strokeStyle = "rgba(48, 54, 61, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (!dataPoints || dataPoints.length < 2) return;

    // Scale calculation
    const maxVal = Math.max(...dataPoints, (critThreshold || 10) * 1.15, 1.0);
    const minVal = Math.min(0, ...dataPoints);
    const range = maxVal - minVal || 1;

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.75;

    const step = width / (dataPoints.length - 1);

    dataPoints.forEach((val, i) => {
      const normY = h - ((val - minVal) / range) * (h - 10) - 5;
      const x = i * step;
      if (i === 0) {
        ctx.moveTo(x, normY);
      } else {
        ctx.lineTo(x, normY);
      }
    });
    ctx.stroke();

    // Threshold lines
    if (warnThreshold) {
      const warnY = h - ((warnThreshold - minVal) / range) * (h - 10) - 5;
      ctx.strokeStyle = "rgba(210, 153, 34, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(0, warnY);
      ctx.lineTo(width, warnY);
      ctx.stroke();
    }

    if (critThreshold) {
      const critY = h - ((critThreshold - minVal) / range) * (h - 10) - 5;
      ctx.strokeStyle = "rgba(248, 81, 73, 0.85)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(0, critY);
      ctx.lineTo(width, critY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

  }, [dataPoints, lineColor, warnThreshold, critThreshold, height]);

  let statusColor = "text-[#58a6ff]";
  if (critThreshold && currentValue >= critThreshold) {
    statusColor = "text-[#f85149]";
  } else if (warnThreshold && currentValue >= warnThreshold) {
    statusColor = "text-[#e3b341]";
  }

  return (
    <div className="scada-card p-3 bg-[#161b22] border-[#30363d]">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8b949e]">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-mono-nums font-semibold ${statusColor}`}>
            {currentValue !== undefined ? (typeof currentValue === "number" ? currentValue.toFixed(2) : currentValue) : "--"}
          </span>
          <span className="text-[10px] font-mono text-[#8b949e]">{unit}</span>
        </div>
      </div>

      <div className="border border-[#30363d] rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={height}
          className="w-full h-auto block"
        />
      </div>

      <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-[#8b949e]">
        <span>T-60s</span>
        {warnThreshold && <span className="text-[#e3b341]">Warn: {warnThreshold}{unit}</span>}
        {critThreshold && <span className="text-[#f85149]">Crit: {critThreshold}{unit}</span>}
        <span className="text-[#58a6ff]">LIVE</span>
      </div>
    </div>
  );
}
