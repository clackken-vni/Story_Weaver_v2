import type { ReactNode } from 'react';
import { NeoPrintCard } from '../foundation/NeoPrintCard';

interface NeoPrintActivityFeedItem {
  id: string;
  title: ReactNode;
  meta: ReactNode;
  tone?: 'default' | 'healthy' | 'degraded' | 'critical';
}

interface NeoPrintActivityFeedProps {
  items: NeoPrintActivityFeedItem[];
  emptyLabel?: string;
}

export function NeoPrintActivityFeed({ items, emptyLabel = 'No activity yet' }: NeoPrintActivityFeedProps) {
  if (items.length === 0) {
    return <NeoPrintCard><p style={{ fontSize: 'var(--text-sm)', color: 'var(--np-muted)' }}>{emptyLabel}</p></NeoPrintCard>;
  }

  return (
    <NeoPrintCard style={{ padding: 0 }}>
      <ol style={{ listStyle: 'none' }}>
        {items.map((item, index) => (
          <li
            key={item.id}
            style={{
              padding: '14px 16px',
              display: 'grid',
              gap: '6px',
              borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--np-line)',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--np-ink)' }}>{item.title}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--np-muted)' }}>{item.meta}</div>
          </li>
        ))}
      </ol>
    </NeoPrintCard>
  );
}
