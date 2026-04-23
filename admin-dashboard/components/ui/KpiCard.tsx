import { NeoPrintKpiCard } from '../neo-print';

type KpiSeverity = 'healthy' | 'degraded' | 'critical' | 'unknown';
type KpiTrend = 'up' | 'down' | 'flat';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: KpiTrend;
  trendLabel?: string;
  severity?: KpiSeverity;
}

export function KpiCard({
  label,
  value,
  trend = 'flat',
  trendLabel,
  severity = 'unknown',
}: KpiCardProps) {
  return <NeoPrintKpiCard label={label} value={value} trend={trend} trendLabel={trendLabel} severity={severity} />;
}
