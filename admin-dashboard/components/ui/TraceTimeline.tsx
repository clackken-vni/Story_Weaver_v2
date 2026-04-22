import { GitBranch } from 'lucide-react';

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
    return <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No trace events found.</p>;
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
                  background: 'var(--border-primary)',
                }}
                aria-hidden="true"
              />
            )}
          </div>
          <article
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--card-bg)',
              padding: 'var(--space-3)',
              display: 'grid',
              gap: 'var(--space-1)',
            }}
          >
            <strong style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', gap: 'var(--space-1)', alignItems: 'center' }}>
              <GitBranch size={12} aria-hidden="true" />
              {event.action}
            </strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Actor: {event.actorId}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Outcome: {event.outcome}</span>
            <time className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {new Date(event.timestamp).toLocaleString()}
            </time>
          </article>
        </li>
      ))}
    </ol>
  );
}
