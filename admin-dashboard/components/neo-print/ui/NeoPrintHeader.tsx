import type { ReactNode } from 'react';
import { NeoPrintTag } from './NeoPrintTag';

interface NeoPrintHeaderProps {
  kicker: string;
  title: string;
  strapline: string;
  edition: string;
  actions?: ReactNode;
}

export function NeoPrintHeader({ kicker, title, strapline, edition, actions }: NeoPrintHeaderProps) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 0.7fr)',
        gap: 'var(--space-4)',
      }}
      className="np-header"
    >
      <div style={{ border: '1px solid var(--np-line)', padding: 'var(--space-5)', background: 'var(--np-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
          <NeoPrintTag>{edition}</NeoPrintTag>
          <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--np-muted)' }}>
            {kicker}
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--np-font-display)', fontSize: 'clamp(2.2rem, 1.8rem + 1.6vw, 3.8rem)', lineHeight: 0.9, color: 'var(--np-ink)' }}>
          {title}
        </h1>
        <p style={{ marginTop: 'var(--space-3)', maxWidth: 620, color: 'var(--np-muted)', fontSize: 'var(--text-sm)' }}>{strapline}</p>
      </div>

      <div style={{ border: '1px solid var(--np-line)', padding: 'var(--space-5)', background: 'var(--np-surface-muted)', display: 'grid', alignContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ fontFamily: 'var(--np-font-display)', fontSize: 'clamp(1.5rem, 1.2rem + 0.7vw, 2.1rem)', lineHeight: 0.92, color: 'var(--np-ink)' }}>
            Lead Signal
          </div>
          <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--np-muted)' }}>
            Editorial shell with system state preserved.
          </div>
        </div>
        {actions ? <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>{actions}</div> : null}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .np-header {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </header>
  );
}
