import { useState } from 'react';
import { Search } from 'lucide-react';
import { ModuleShell } from './ModuleShell';
import { useAudit } from '../hooks/useAudit';
import { AuditEventRow } from './ui/AuditEventRow';
import { TraceTimeline } from './ui/TraceTimeline';
import { SkeletonLoader } from './ui/SkeletonLoader';

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
    if (!traceInput.trim()) return;
    void searchTrace(traceInput.trim());
  };

  return (
    <ModuleShell title="Audit & Compliance" subtitle="Event timeline, trace explorer, export" loading={false} error={error}>
      <section style={{ display: 'grid', gap: 'var(--space-5)' }}>
        {/* Search + trace */}
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
          <button type="button" onClick={handleTraceSearch} className="audit-search-btn">
            <Search size={14} aria-hidden="true" />
            Search
          </button>
        </div>

        {/* Event list — real data */}
        {loading ? (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <SkeletonLoader variant="row" /><SkeletonLoader variant="row" /><SkeletonLoader variant="row" />
          </div>
        ) : eventList.length === 0 ? (
          <div className="audit-empty">No audit events found.</div>
        ) : (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <h3 className="audit-section-title">Event list</h3>
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

        {/* Trace timeline — real data */}
        {traceEvents.length > 0 && (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <h3 className="audit-section-title">Trace timeline</h3>
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
        )}
      </section>

      <style jsx>{`
        .audit-search-bar { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        .audit-search-wrap { position: relative; flex: 1; min-width: 240px; }
        .audit-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); pointer-events: none; }
        .audit-search-input {
          width: 100%; padding: 10px 12px 10px 34px; font-size: var(--text-sm);
          background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-lg);
          color: var(--text-primary); outline: none; transition: border-color 0.15s;
        }
        .audit-search-input:focus { border-color: var(--primary-500); }
        .audit-search-btn {
          display: inline-flex; align-items: center; gap: var(--space-1);
          padding: 10px 14px; font-size: var(--text-sm); font-weight: var(--weight-medium);
          background: var(--primary-600); color: #fff; border: 1px solid var(--primary-600);
          border-radius: var(--radius-lg); cursor: pointer; transition: background 0.15s;
        }
        .audit-search-btn:hover { background: var(--primary-700); }
        .audit-section-title { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); }
        .audit-empty {
          border: 1px dashed var(--border-primary); border-radius: var(--radius-xl);
          background: var(--surface-secondary); color: var(--text-tertiary);
          font-size: var(--text-sm); padding: var(--space-8); text-align: center;
        }
      `}</style>
    </ModuleShell>
  );
}
