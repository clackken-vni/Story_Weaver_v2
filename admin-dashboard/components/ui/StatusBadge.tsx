type StatusVariant = 'healthy' | 'degraded' | 'critical' | 'unknown';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

const STATUS_LABEL: Record<StatusVariant, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  critical: 'Critical',
  unknown: 'Unknown',
};

const STATUS_STYLE: Record<StatusVariant, { text: string; background: string; border: string }> = {
  healthy: {
    text: 'var(--status-healthy)',
    background: 'var(--status-healthy-bg)',
    border: 'var(--status-healthy)',
  },
  degraded: {
    text: 'var(--status-degraded)',
    background: 'var(--status-degraded-bg)',
    border: 'var(--status-degraded)',
  },
  critical: {
    text: 'var(--status-critical)',
    background: 'var(--status-critical-bg)',
    border: 'var(--status-critical)',
  },
  unknown: {
    text: 'var(--status-unknown)',
    background: 'var(--status-unknown-bg)',
    border: 'var(--status-unknown)',
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const palette = STATUS_STYLE[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.text,
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        padding: '2px 10px',
      }}
    >
      <span className={`status-dot status-dot--${status}`} aria-hidden="true" />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
