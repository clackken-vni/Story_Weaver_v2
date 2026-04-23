import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { NeoPrintButton, NeoPrintCard, NeoPrintTag } from '../neo-print';

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

const SEVERITY_TONE: Record<IncidentSeverity, 'default' | 'degraded' | 'critical'> = {
  low: 'default',
  medium: 'degraded',
  high: 'critical',
  critical: 'critical',
};

const STATUS_TONE: Record<IncidentStatus, 'default' | 'degraded' | 'critical' | 'healthy'> = {
  open: 'critical',
  investigating: 'degraded',
  acknowledged: 'healthy',
  resolved: 'healthy',
};

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
    <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <AlertTriangle size={16} style={{ color: severityColor(severity) }} aria-hidden="true" />
          <strong style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.35rem', lineHeight: 0.96, color: 'var(--np-ink)' }}>{title}</strong>
        </div>
        <div style={{ display: 'inline-flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <NeoPrintTag tone={SEVERITY_TONE[severity]}>{severity}</NeoPrintTag>
          <NeoPrintTag tone={STATUS_TONE[status]}>{status}</NeoPrintTag>
        </div>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', color: 'var(--np-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>Owner: {owner}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Clock3 size={12} aria-hidden="true" />
          {new Date(createdAt).toLocaleString()}
        </span>
      </div>

      {openForAck ? (
        <NeoPrintButton type="button" variant="secondary" onClick={() => onAcknowledge(id)} style={{ justifySelf: 'start' }}>
          Acknowledge
        </NeoPrintButton>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--status-healthy)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <CheckCircle2 size={12} aria-hidden="true" />
          Already acknowledged
        </span>
      )}
    </NeoPrintCard>
  );
}

function severityColor(severity: IncidentSeverity) {
  if (severity === 'critical') return 'var(--status-critical)';
  if (severity === 'high') return 'var(--status-critical)';
  if (severity === 'medium') return 'var(--status-degraded)';
  return 'var(--np-muted)';
}
