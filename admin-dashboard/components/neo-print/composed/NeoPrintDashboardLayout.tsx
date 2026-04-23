import type { ReactNode } from 'react';

interface NeoPrintDashboardLayoutProps {
  header: ReactNode;
  stats: ReactNode;
  content: ReactNode;
}

export function NeoPrintDashboardLayout({ header, stats, content }: NeoPrintDashboardLayoutProps) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      {header}
      {stats}
      {content}
    </div>
  );
}
