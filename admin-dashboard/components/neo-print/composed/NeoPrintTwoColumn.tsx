import type { ReactNode } from 'react';

interface NeoPrintTwoColumnProps {
  main: ReactNode;
  side: ReactNode;
}

export function NeoPrintTwoColumn({ main, side }: NeoPrintTwoColumnProps) {
  return (
    <div className="np-two-column" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.8fr)', gap: 'var(--space-4)' }}>
      <div>{main}</div>
      <div>{side}</div>
      <style jsx>{`
        @media (max-width: 960px) {
          .np-two-column {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
