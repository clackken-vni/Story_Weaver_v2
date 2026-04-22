type InfraStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

interface InfraItem {
  component: string;
  status: InfraStatus;
}

interface InfraStripProps {
  items: InfraItem[];
}

export function InfraStrip({ items }: InfraStripProps) {
  return (
    <section style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' as unknown as number }}>
        Infrastructure
      </h3>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <span
            key={item.component}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
              border: `1px solid ${colorForStatus(item.status)}`,
              background: backgroundForStatus(item.status),
              color: colorForStatus(item.status),
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
            }}
          >
            <span className={`status-dot status-dot--${item.status}`} aria-hidden="true" />
            {item.component} — {item.status}
          </span>
        ))}
      </div>
    </section>
  );
}

function colorForStatus(status: InfraStatus) {
  if (status === 'healthy') return 'var(--status-healthy)';
  if (status === 'degraded') return 'var(--status-degraded)';
  if (status === 'critical') return 'var(--status-critical)';
  return 'var(--status-unknown)';
}

function backgroundForStatus(status: InfraStatus) {
  if (status === 'healthy') return 'var(--status-healthy-bg)';
  if (status === 'degraded') return 'var(--status-degraded-bg)';
  if (status === 'critical') return 'var(--status-critical-bg)';
  return 'var(--status-unknown-bg)';
}
