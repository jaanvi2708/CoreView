import React from "react";
import { HealthState, AssetStatus, AlertSeverity } from "@/lib/types";

interface StatusBadgeProps {
  status: HealthState | AssetStatus | AlertSeverity | string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export default function StatusBadge({ status, size = "md", pulse = false }: StatusBadgeProps) {
  const norm = status ? status.toLowerCase() : "healthy";

  // New teal-industrial palette
  let color = "#bbc9c6";
  let bg = "rgba(187,201,198,0.08)";
  let border = "rgba(187,201,198,0.2)";
  let ledColor = "#bbc9c6";
  let label = status;

  if (["healthy", "operational", "in stock", "completed", "approved", "optimal", "nominal"].includes(norm)) {
    color = "#6feee1";
    bg = "rgba(111,238,225,0.08)";
    border = "rgba(111,238,225,0.25)";
    ledColor = "#6feee1";
    label = norm === "healthy" ? "Normal" : norm === "optimal" ? "Optimal" : status;
  } else if (["warning", "degraded", "reserved", "assigned", "in progress", "p2 - high", "pending review"].includes(norm)) {
    color = "#ffab67";
    bg = "rgba(255,171,103,0.08)";
    border = "rgba(255,171,103,0.28)";
    ledColor = "#ffab67";
    label = (norm === "warning" || norm === "degraded") ? "Warning" : status;
  } else if (["critical", "emergency", "p1 - emergency", "rejected", "on order", "needs attention"].includes(norm)) {
    color = "#ffb4ab";
    bg = "rgba(255,180,171,0.08)";
    border = "rgba(255,180,171,0.28)";
    ledColor = "#ffb4ab";
    label = norm === "critical" ? "Attention" : norm === "p1 - emergency" ? "Urgent" : status;
  } else if (["info", "active"].includes(norm)) {
    color = "#8ecdff";
    bg = "rgba(142,205,255,0.08)";
    border = "rgba(142,205,255,0.25)";
    ledColor = "#8ecdff";
  }

  const fontSize = size === "sm" ? 10 : size === "lg" ? 12 : 11;
  const padding = size === "sm" ? "2px 8px" : size === "lg" ? "6px 12px" : "3px 10px";

  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold uppercase"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize,
        letterSpacing: "0.05em",
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding,
        whiteSpace: "nowrap",
      }}
    >
      <span
        className={pulse ? "cv-pulse" : ""}
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ledColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
