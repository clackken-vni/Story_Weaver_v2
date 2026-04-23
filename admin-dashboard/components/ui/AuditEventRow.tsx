import { Clock3, Link2 } from 'lucide-react';
import { NeoPrintCard, NeoPrintTag } from '../neo-print';

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
    <NeoPrintCard key={id} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.25rem', lineHeight: 0.96, color: 'var(--np-ink)' }}>{action}</strong>
        <NeoPrintTag tone={success ? 'healthy' : 'critical'}>{outcome}</NeoPrintTag>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
        <span style={{ color: 'var(--np-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Actor: <strong style={{ color: 'var(--np-ink)' }}>{actorId}</strong> ({actorRole})
        </span>
        <span style={{ color: 'var(--np-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Resource: <strong style={{ color: 'var(--np-ink)' }}>{resource}{resourceId ? `/${resourceId}` : ''}</strong>
        </span>
      </div>

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', borderTop: '1px solid var(--np-line)', paddingTop: 'var(--space-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--np-muted)', fontSize: 'var(--text-xs)' }}>
          <Clock3 size={12} aria-hidden="true" />
          {new Date(timestamp).toLocaleString()}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--np-accent)', fontSize: 'var(--text-xs)' }}>
          <Link2 size={12} aria-hidden="true" />
          {traceId}
        </span>
      </footer>
    </NeoPrintCard>
  );
}
