import { Activity, Clock3 } from 'lucide-react';

type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

interface ServiceCardProps {
  name: string;
  status: ServiceStatus;
  p95LatencyMs: number;
  errorRate: number;
}

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
    <article
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${statusColor}`,
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' as unknown as number }}>{name}</h3>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: statusColor, fontSize: 'var(--text-xs)' }}>
          <span className={`status-dot status-dot--${status}`} aria-hidden="true" />
          {status}
        </span>
      </header>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            <Clock3 size={12} aria-hidden="true" />
            p95 latency
          </span>
          <strong className="font-mono" style={{ fontSize: 'var(--text-sm)' }}>
            {p95LatencyMs}ms
          </strong>
        </div>
        <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--surface-tertiary)', overflow: 'hidden' }}>
          <div style={{ width: `${latencyPercent}%`, height: '100%', background: statusColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <Activity size={12} aria-hidden="true" />
          Error rate
        </span>
        <span style={{ color: statusColor, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number }}>
          {errorPercent.toFixed(1)}%
        </span>
      </div>

      <div
        style={{
          borderTop: '1px dashed var(--border-primary)',
          paddingTop: 'var(--space-2)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        Operational detail summary available in Monitoring module.
      </div>
    </article>
  );
}
