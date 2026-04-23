import { NeoPrintCard } from '../foundation/NeoPrintCard';
import { NeoPrintTag } from './NeoPrintTag';

export type NeoPrintKpiSeverity = 'healthy' | 'degraded' | 'critical' | 'unknown';
export type NeoPrintKpiTrend = 'up' | 'down' | 'flat';

interface NeoPrintKpiCardProps {
  label: string;
  value: string | number;
  trend?: NeoPrintKpiTrend;
  trendLabel?: string;
  severity?: NeoPrintKpiSeverity;
}

const SEVERITY_TONE: Record<NeoPrintKpiSeverity, 'default' | 'healthy' | 'degraded' | 'critical'> = {
  healthy: 'healthy',
  degraded: 'degraded',
  critical: 'critical',
  unknown: 'default',
};

export function NeoPrintKpiCard({
  label,
  value,
  trend = 'flat',
  trendLabel = 'No change',
  severity = 'unknown',
}: NeoPrintKpiCardProps) {
  return (
    <NeoPrintCard style={{ minHeight: 132, display: 'grid', alignContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--np-muted)' }}>{label}</div>
        <div style={{ marginTop: 'var(--space-2)', fontFamily: 'var(--np-font-display)', fontSize: 'clamp(2rem, 1.7rem + 0.8vw, 2.8rem)', lineHeight: 0.92, color: 'var(--np-ink)' }}>
          {value}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <NeoPrintTag tone={SEVERITY_TONE[severity]}>{severity}</NeoPrintTag>
        <span style={{ fontSize: 'var(--text-xs)', color: trend === 'up' ? 'var(--status-critical)' : trend === 'down' ? 'var(--status-healthy)' : 'var(--np-muted)' }}>
          {trendLabel}
        </span>
      </div>
    </NeoPrintCard>
  );
}
