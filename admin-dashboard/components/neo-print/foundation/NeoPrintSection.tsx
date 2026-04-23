import type { CSSProperties, ReactNode } from 'react';

interface NeoPrintSectionProps {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

export function NeoPrintSection({ title, eyebrow, actions, children, style }: NeoPrintSectionProps) {
  return (
    <section style={{ display: 'grid', gap: 'var(--space-3)', ...style }}>
      {(title || eyebrow || actions) && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '4px' }}>
            {eyebrow ? (
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--np-muted)' }}>
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h3 style={{ fontFamily: 'var(--np-font-display)', fontSize: 'clamp(1.2rem, 1.1rem + 0.6vw, 1.8rem)', lineHeight: 0.95, color: 'var(--np-ink)' }}>
                {title}
              </h3>
            ) : null}
          </div>
          {actions ? <div style={{ display: 'inline-flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
