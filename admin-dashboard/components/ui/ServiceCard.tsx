import { Activity, Clock3 } from 'lucide-react';
import { NeoPrintCard, NeoPrintTag } from '../neo-print';

type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

interface ServiceCardProps {
  name: string;
  status: ServiceStatus;
  p95LatencyMs: number;
  errorRate: number;
}

const STATUS_TONE: Record<ServiceStatus, 'healthy' | 'degraded' | 'critical' | 'default'> = {
  healthy: 'healthy',
  degraded: 'degraded',
  critical: 'critical',
  unknown: 'default',
};

export function ServiceCard({ name, status, p95LatencyMs, errorRate }: ServiceCardProps) {
  const statusColor =
    status === 'healthy'
      ? 'var(--status-healthy)'
      : status === 'degraded'
        ? 'var(--status-degraded)'
        : status === 'critical'
          ? 'var(--status-critical)'
          : 'var(--status-unknown)';

  const errorPercent = Math.max(0, Math.min(100, errorRate * 100));
  const latencyPercent = Math.max(5, Math.min(100, p95LatencyMs / 8));

  return (
    <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <h3 style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.35rem', lineHeight: 0.95, color: 'var(--np-ink)' }}>{name}</h3>
        <NeoPrintTag tone={STATUS_TONE[status]}>{status}</NeoPrintTag>
      </header>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--np-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <Clock3 size={12} aria-hidden="true" />
            p95 latency
          </span>
          <strong style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.1rem', color: 'var(--np-ink)' }}>
            {p95LatencyMs}ms
          </strong>
        </div>
        <div style={{ height: 6, background: 'var(--np-surface-muted)', overflow: 'hidden' }}>
          <div style={{ width: `${latencyPercent}%`, height: '100%', background: statusColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--np-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <Activity size={12} aria-hidden="true" />
          Error rate
        </span>
        <span style={{ color: statusColor, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          {errorPercent.toFixed(1)}%
        </span>
      </div>

      <div style={{ borderTop: '1px solid var(--np-line)', paddingTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--np-muted)' }}>
        Operational detail summary available in Monitoring module.
      </div>
    </NeoPrintCard>
  );
}
