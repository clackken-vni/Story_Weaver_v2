import { NeoPrintCard, NeoPrintTag } from '../neo-print';

type InfraStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

interface InfraItem {
  component: string;
  status: InfraStatus;
}

interface InfraStripProps {
  items: InfraItem[];
}

const STATUS_TONE: Record<InfraStatus, 'healthy' | 'degraded' | 'critical' | 'default'> = {
  healthy: 'healthy',
  degraded: 'degraded',
  critical: 'critical',
  unknown: 'default',
};

export function InfraStrip({ items }: InfraStripProps) {
  return (
    <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <h3 style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.5rem', lineHeight: 0.96, color: 'var(--np-ink)' }}>
        Infrastructure
      </h3>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <NeoPrintTag key={item.component} tone={STATUS_TONE[item.status]}>
            {item.component} — {item.status}
          </NeoPrintTag>
        ))}
      </div>
    </NeoPrintCard>
  );
}
