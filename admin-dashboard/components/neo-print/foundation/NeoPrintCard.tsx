import type { CSSProperties, ReactNode } from 'react';

interface NeoPrintCardProps {
  children: ReactNode;
  style?: CSSProperties;
  tone?: 'default' | 'muted' | 'accent' | 'danger';
}

const TONE_STYLE: Record<NonNullable<NeoPrintCardProps['tone']>, CSSProperties> = {
  default: {
    background: 'var(--np-surface)',
    borderColor: 'var(--np-line)',
  },
  muted: {
    background: 'var(--np-surface-muted)',
    borderColor: 'var(--np-line)',
  },
  accent: {
    background: 'var(--np-accent-soft)',
    borderColor: 'var(--np-accent)',
  },
  danger: {
    background: 'var(--status-critical-bg)',
    borderColor: 'var(--status-critical)',
  },
};

export function NeoPrintCard({ children, style, tone = 'default' }: NeoPrintCardProps) {
  return (
    <article
      style={{
        border: '1px solid',
        borderRadius: 0,
        boxShadow: 'var(--np-shadow)',
        padding: 'var(--space-4)',
        ...TONE_STYLE[tone],
        ...style,
      }}
    >
      {children}
    </article>
  );
}
