import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

type KpiSeverity = 'healthy' | 'degraded' | 'critical' | 'unknown';
type KpiTrend = 'up' | 'down' | 'flat';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: KpiTrend;
  trendLabel?: string;
  severity?: KpiSeverity;
}

const SEVERITY_BORDER: Record<KpiSeverity, string> = {
  healthy: 'var(--status-healthy)',
  degraded: 'var(--status-degraded)',
  critical: 'var(--status-critical)',
  unknown: 'var(--status-unknown)',
};

const TREND_COLOR: Record<KpiTrend, string> = {
  up: 'var(--status-critical)',
  down: 'var(--status-healthy)',
  flat: 'var(--text-tertiary)',
};

export function KpiCard({
  label,
  value,
  trend = 'flat',
  trendLabel,
  severity = 'unknown',
}: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <article
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderLeft: `4px solid ${SEVERITY_BORDER[severity]}`,
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <p style={{ fontSize: 'var(--kpi-label-size)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
        {label}
      </p>
      <p
        className="font-mono"
        style={{
          fontSize: 'var(--kpi-value-size)',
          lineHeight: 'var(--leading-tight)',
          color: 'var(--text-primary)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
        }}
      >
        {value}
      </p>
      <div
        style={{
          marginTop: 'var(--space-3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: TREND_COLOR[trend],
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)' as unknown as number,
        }}
      >
        <TrendIcon size={14} aria-hidden="true" />
        <span>{trendLabel ?? 'No change'}</span>
      </div>
    </article>
  );
}
