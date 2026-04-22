import { Clock3, Link2 } from 'lucide-react';

interface AuditEventRowProps {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'error' | string;
  traceId: string;
  timestamp: string;
}

export function AuditEventRow({
  id,
  action,
  actorId,
  actorRole,
  resource,
  resourceId,
  outcome,
  traceId,
  timestamp,
}: AuditEventRowProps) {
  const success = outcome === 'success';

  return (
    <article
      key={id}
      style={{
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        background: 'var(--card-bg)',
        padding: 'var(--space-3)',
        display: 'grid',
        gap: 'var(--space-2)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <strong style={{ fontSize: 'var(--text-sm)' }}>{action}</strong>
        <span
          style={{
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${success ? 'var(--status-healthy)' : 'var(--status-critical)'}`,
            background: success ? 'var(--status-healthy-bg)' : 'var(--status-critical-bg)',
            color: success ? 'var(--status-healthy)' : 'var(--status-critical)',
            fontSize: 'var(--text-xs)',
            padding: '2px 8px',
            fontWeight: 'var(--weight-semibold)' as unknown as number,
            textTransform: 'uppercase',
          }}
        >
          {outcome}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          Actor: <strong style={{ color: 'var(--text-secondary)' }}>{actorId}</strong> ({actorRole})
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          Resource: <strong style={{ color: 'var(--text-secondary)' }}>{resource}{resourceId ? `/${resourceId}` : ''}</strong>
        </span>
      </div>

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          <Clock3 size={12} aria-hidden="true" />
          {new Date(timestamp).toLocaleString()}
        </span>
        <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--accent-secondary)', fontSize: 'var(--text-xs)' }}>
          <Link2 size={12} aria-hidden="true" />
          {traceId}
        </span>
      </footer>
    </article>
  );
}
