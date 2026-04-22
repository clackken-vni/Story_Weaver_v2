import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
type IncidentStatus = 'open' | 'investigating' | 'acknowledged' | 'resolved';

interface IncidentRowProps {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner: string;
  createdAt: string;
  onAcknowledge: (id: string) => void;
}

export function IncidentRow({
  id,
  title,
  severity,
  status,
  owner,
  createdAt,
  onAcknowledge,
}: IncidentRowProps) {
  const openForAck = status === 'open' || status === 'investigating';

  return (
    <article
      style={{
        border: '1px solid var(--card-border)',
        borderLeft: `3px solid ${severityColor(severity)}`,
        borderRadius: 'var(--card-radius)',
        background: 'var(--card-bg)',
        padding: 'var(--space-3)',
        display: 'grid',
        gap: 'var(--space-2)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <AlertTriangle size={14} style={{ color: severityColor(severity) }} aria-hidden="true" />
          <strong style={{ fontSize: 'var(--text-sm)' }}>{title}</strong>
        </div>
        <span style={pillStyle(severityColor(severity), severityBackground(severity))}>{severity}</span>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
        <span>Owner: {owner}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Clock3 size={12} aria-hidden="true" />
          {new Date(createdAt).toLocaleString()}
        </span>
        <span>Status: {status}</span>
      </div>

      {openForAck ? (
        <button
          type="button"
          onClick={() => onAcknowledge(id)}
          style={{
            justifySelf: 'start',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-tertiary)',
            color: 'var(--text-secondary)',
            padding: '4px 10px',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
          }}
        >
          Acknowledge
        </button>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--status-healthy)', fontSize: 'var(--text-xs)' }}>
          <CheckCircle2 size={12} aria-hidden="true" />
          Already acknowledged
        </span>
      )}
    </article>
  );
}

function severityColor(severity: IncidentSeverity) {
  if (severity === 'critical') return 'var(--status-critical)';
  if (severity === 'high') return 'var(--status-critical)';
  if (severity === 'medium') return 'var(--status-degraded)';
  return 'var(--status-unknown)';
}

function severityBackground(severity: IncidentSeverity) {
  if (severity === 'critical' || severity === 'high') return 'var(--status-critical-bg)';
  if (severity === 'medium') return 'var(--status-degraded-bg)';
  return 'var(--status-unknown-bg)';
}

function pillStyle(color: string, background: string) {
  return {
    color,
    background,
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${color}`,
    padding: '2px 8px',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    textTransform: 'uppercase' as const,
  };
}
