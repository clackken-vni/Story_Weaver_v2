import { GitBranch } from 'lucide-react';
import { NeoPrintCard } from '../neo-print';

interface TraceEvent {
  id: string;
  action: string;
  actorId: string;
  outcome: string;
  timestamp: string;
}

interface TraceTimelineProps {
  events: TraceEvent[];
}

export function TraceTimeline({ events }: TraceTimelineProps) {
  if (events.length === 0) {
    return <p style={{ color: 'var(--np-muted)', fontSize: 'var(--text-sm)' }}>No trace events found.</p>;
  }

  return (
    <ol style={{ listStyle: 'none', display: 'grid', gap: 'var(--space-3)' }}>
      {events.map((event, index) => (
        <li key={event.id} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 'var(--radius-full)',
                background: event.outcome === 'success' ? 'var(--status-healthy)' : 'var(--status-critical)',
                display: 'block',
                marginTop: 6,
              }}
              aria-hidden="true"
            />
            {index < events.length - 1 && (
              <span
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 18,
                  bottom: -20,
                  width: 2,
                  background: 'var(--np-line)',
                }}
                aria-hidden="true"
              />
            )}
          </div>
          <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <strong style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.1rem', display: 'inline-flex', gap: 'var(--space-1)', alignItems: 'center', color: 'var(--np-ink)' }}>
              <GitBranch size={12} aria-hidden="true" />
              {event.action}
            </strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--np-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actor: {event.actorId}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--np-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outcome: {event.outcome}</span>
            <time style={{ fontSize: 'var(--text-xs)', color: 'var(--np-muted)' }}>
              {new Date(event.timestamp).toLocaleString()}
            </time>
          </NeoPrintCard>
        </li>
      ))}
    </ol>
  );
}
