import type { ReactNode } from 'react';

interface NeoPrintTagProps {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'healthy' | 'degraded' | 'critical';
}

const TONE_STYLE = {
  default: {
    color: 'var(--np-muted)',
    borderColor: 'var(--np-line)',
    background: 'transparent',
  },
  accent: {
    color: 'var(--np-accent)',
    borderColor: 'var(--np-accent)',
    background: 'var(--np-accent-soft)',
  },
  healthy: {
    color: 'var(--status-healthy)',
    borderColor: 'var(--status-healthy)',
    background: 'var(--status-healthy-bg)',
  },
  degraded: {
    color: 'var(--status-degraded)',
    borderColor: 'var(--status-degraded)',
    background: 'var(--status-degraded-bg)',
  },
  critical: {
    color: 'var(--status-critical)',
    borderColor: 'var(--status-critical)',
    background: 'var(--status-critical-bg)',
  },
} as const;

export function NeoPrintTag({ children, tone = 'default' }: NeoPrintTagProps) {
  const palette = TONE_STYLE[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '3px 8px',
        border: '1px solid',
        borderRadius: 0,
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        ...palette,
      }}
    >
      {children}
    </span>
  );
}
