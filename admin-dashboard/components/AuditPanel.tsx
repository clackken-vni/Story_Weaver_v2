import { useState } from 'react';
import { Search } from 'lucide-react';
import { ModuleShell } from './ModuleShell';
import { useAudit } from '../hooks/useAudit';
import { AuditEventRow } from './ui/AuditEventRow';
import { TraceTimeline } from './ui/TraceTimeline';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { NeoPrintButton, NeoPrintCard, NeoPrintTag } from './neo-print';

interface AuditEvent {
  id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  resource: string;
  resource_id?: string;
  outcome: string;
  trace_id: string;
  timestamp: string;
}

export function AuditPanel() {
  const { events, traceChain, loading, error, searchTrace } = useAudit();
  const [traceInput, setTraceInput] = useState('');

  const eventList = (events?.data as { events?: AuditEvent[] } | undefined)?.events ?? [];
  const traceEvents = (traceChain?.data as { events?: AuditEvent[] } | undefined)?.events ?? [];

  const handleTraceSearch = () => {
    if (!traceInput.trim()) {
      return;
    }

    void searchTrace(traceInput.trim());
  };

  return (
    <ModuleShell title="Audit & Compliance" subtitle="Event timeline, trace explorer, export" loading={false} error={error}>
      <section style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className="audit-heading-row">
            <div>
              <p className="audit-kicker">Trace explorer</p>
              <h3 className="audit-title">Search the chain of record</h3>
            </div>
            <NeoPrintTag tone={traceEvents.length > 0 ? 'accent' : 'default'}>
              {traceEvents.length > 0 ? `${traceEvents.length} linked events` : 'Idle'}
            </NeoPrintTag>
          </div>
          <div className="audit-search-bar">
            <label htmlFor="trace-search" className="sr-only">Search by trace id</label>
            <div className="audit-search-wrap">
              <Search size={14} className="audit-search-icon" />
              <input
                id="trace-search"
                type="text"
                value={traceInput}
                onChange={(e) => setTraceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTraceSearch()}
                placeholder="Search by traceId..."
                className="audit-search-input"
              />
            </div>
            <NeoPrintButton type="button" variant="secondary" onClick={handleTraceSearch}>
              <Search size={14} aria-hidden="true" />
              Search
            </NeoPrintButton>
          </div>
        </NeoPrintCard>

        {loading ? (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <SkeletonLoader variant="row" />
            <SkeletonLoader variant="row" />
            <SkeletonLoader variant="row" />
          </div>
        ) : eventList.length === 0 ? (
          <NeoPrintCard>
            <p className="audit-copy">No audit events found.</p>
          </NeoPrintCard>
        ) : (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="audit-heading-row">
              <div>
                <p className="audit-kicker">Event wire</p>
                <h3 className="audit-title">Event list</h3>
              </div>
              <NeoPrintTag tone="default">{eventList.length} entries</NeoPrintTag>
            </div>
            {eventList.map((event) => (
              <AuditEventRow
                key={event.id}
                id={event.id}
                action={event.action}
                actorId={event.actor_id}
                actorRole={event.actor_role}
                resource={event.resource}
                resourceId={event.resource_id}
                outcome={event.outcome}
                traceId={event.trace_id}
                timestamp={event.timestamp}
              />
            ))}
          </section>
        )}

        {traceEvents.length > 0 ? (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="audit-heading-row">
              <div>
                <p className="audit-kicker">Chain view</p>
                <h3 className="audit-title">Trace timeline</h3>
              </div>
              <NeoPrintTag tone="accent">Trace result</NeoPrintTag>
            </div>
            <TraceTimeline
              events={traceEvents.map((event) => ({
                id: event.id,
                action: event.action,
                actorId: event.actor_id,
                outcome: event.outcome,
                timestamp: event.timestamp,
              }))}
            />
          </section>
        ) : null}
      </section>

      <style jsx>{`
        .audit-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .audit-kicker {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--np-muted);
        }

        .audit-title {
          margin-top: 6px;
          font-family: var(--np-font-display);
          font-size: clamp(1.6rem, 1.35rem + 0.45vw, 2rem);
          line-height: 0.95;
          color: var(--np-ink);
        }

        .audit-copy {
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--np-muted);
        }

        .audit-search-bar {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .audit-search-wrap {
          position: relative;
          flex: 1;
          min-width: 240px;
        }

        .audit-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--np-muted);
          pointer-events: none;
        }

        .audit-search-input {
          width: 100%;
          min-height: 38px;
          padding: 10px 12px 10px 34px;
          font-size: var(--text-sm);
          background: var(--np-surface);
          border: 1px solid var(--np-line);
          color: var(--np-ink);
          outline: none;
        }

        .audit-search-input:focus {
          border-color: var(--np-accent);
          box-shadow: inset 0 0 0 1px var(--np-accent);
        }
      `}</style>
    </ModuleShell>
  );
}
