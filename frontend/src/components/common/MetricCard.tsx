import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  status?: "healthy" | "warning" | "critical" | "neutral" | "cyan";
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

const THEME = {
  healthy: {
    valueColor: '#6feee1',
    borderColor: 'rgba(111,238,225,0.2)',
    bgGlow: 'transparent',
  },
  warning: {
    valueColor: '#ffab67',
    borderColor: 'rgba(255,171,103,0.2)',
    bgGlow: 'transparent',
  },
  critical: {
    valueColor: '#ffb4ab',
    borderColor: 'rgba(255,180,171,0.28)',
    bgGlow: 'rgba(255,180,171,0.04)',
  },
  cyan: {
    valueColor: '#8ecdff',
    borderColor: 'rgba(255,255,255,0.06)',
    bgGlow: 'transparent',
  },
  neutral: {
    valueColor: '#dde4e2',
    borderColor: 'rgba(255,255,255,0.06)',
    bgGlow: 'transparent',
  },
} as const;

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendPositive,
  status = "neutral",
  icon,
  footer
}: MetricCardProps) {
  const t = THEME[status];

  return (
    <div
      className="relative overflow-hidden flex flex-col justify-between transition-all duration-150"
      style={{
        background: '#1A1D21',
        border: `1px solid ${t.borderColor}`,
        borderRadius: '1rem',
        padding: '12px',
        minHeight: 96,
      }}
    >
      {/* Optional tinted glow overlay for critical */}
      {t.bgGlow !== 'transparent' && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: t.bgGlow }} />
      )}

      {/* Header row */}
      <div className="flex justify-between items-start relative z-10">
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#bbc9c6',
          }}
        >
          {title}
        </span>
        {icon && <div style={{ color: '#bbc9c6' }}>{icon}</div>}
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1 relative z-10">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: t.valueColor,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 500,
              color: '#bbc9c6',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Footer row */}
      {(subtitle || trend) && (
        <div
          className="flex items-center justify-between pt-2 relative z-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 6 }}
        >
          {subtitle && (
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 11,
                color: '#bbc9c6',
              }}
            >
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                color: trendPositive ? '#6feee1' : '#ffb4ab',
                marginLeft: 'auto',
              }}
            >
              {trend}
            </span>
          )}
        </div>
      )}

      {footer && (
        <div className="mt-3 pt-2 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
