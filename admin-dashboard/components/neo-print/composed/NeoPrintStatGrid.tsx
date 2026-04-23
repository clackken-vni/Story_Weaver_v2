import type { ReactNode } from 'react';

interface NeoPrintStatGridProps {
  children: ReactNode;
}

export function NeoPrintStatGrid({ children }: NeoPrintStatGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
      {children}
    </div>
  );
}
