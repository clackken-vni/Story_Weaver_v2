import { useMemo, useState } from 'react';
import { ModuleShell } from './ModuleShell';
import { useMonitoring } from '../hooks/useMonitoring';
import { ServiceCard } from './ui/ServiceCard';
import { InfraStrip } from './ui/InfraStrip';
import { IncidentRow } from './ui/IncidentRow';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { adminApi } from '../lib/api';

interface MonitoringService {
  service: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  p95_latency_ms: number;
  error_rate: number;
}

interface InfraComponent {
  component: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
}

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'acknowledged' | 'resolved';
  owner: string;
  created_at: string;
}

const TIME_RANGES = ['1H', '6H', '24H', '7D', '30D'] as const;

export function MonitoringPanel() {
  const { services, infra, incidents, loading, error, refetch } = useMonitoring();
  const [actionError, setActionError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24H');

  const serviceList = useMemo(() => (services?.data as MonitoringService[] | undefined) ?? [], [services]);
  const infraList = useMemo(() => (infra?.data as InfraComponent[] | undefined) ?? [], [infra]);
  const incidentList = useMemo(
    () => ((incidents?.data as { incidents?: Incident[] } | undefined)?.incidents ?? []),
    [incidents]
  );

  const handleAck = async (incidentId: string) => {
    try {
      setActionError(null);
      await adminApi.ackIncident(incidentId);
      refetch();
    } catch {
      setActionError('Failed to acknowledge incident. Please retry.');
    }
  };

  return (
    <ModuleShell title="Monitoring" subtitle="System performance and metrics" loading={false} error={error}>
      {loading ? (
        <section style={{ display: 'grid', gap: 'var(--space-4)' }} aria-label="Loading monitoring panel">
          <div className="mon-service-grid">
            <SkeletonLoader variant="card" /><SkeletonLoader variant="card" /><SkeletonLoader variant="card" />
          </div>
          <SkeletonLoader variant="text" lines={3} />
          <SkeletonLoader variant="row" /><SkeletonLoader variant="row" />
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
          {/* Time Range Selector */}
          <div className="mon-toolbar">
            <div className="mon-time-range">
              {TIME_RANGES.map((range) => (
                <button key={range} type="button"
                  className={`mon-time-btn ${timeRange === range ? 'mon-time-btn--active' : ''}`}
                  onClick={() => setTimeRange(range)}>{range}</button>
              ))}
            </div>
            <button className="mon-export-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>

          {/* Service matrix — real data */}
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <h3 className="mon-section-title">Service matrix</h3>
            {serviceList.length === 0 ? (
              <p className="mon-hint">No services reporting yet. Data will appear when monitoring endpoints are connected.</p>
            ) : (
              <div className="mon-service-grid">
                {serviceList.map((service) => (
                  <ServiceCard key={service.service} name={service.service} status={service.status}
                    p95LatencyMs={service.p95_latency_ms} errorRate={service.error_rate} />
                ))}
              </div>
            )}
          </section>

          {/* Infrastructure — real data */}
          {infraList.length > 0 && <InfraStrip items={infraList} />}

          {/* Error Rate table — real data */}
          {serviceList.length > 0 && (
            <div className="mon-card">
              <div className="mon-card-header">
                <h3 className="mon-card-title">Error Rate</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="mon-table">
                  <thead><tr><th>Service</th><th>Error Rate</th><th>Errors/min</th><th>Status</th></tr></thead>
                  <tbody>
                    {serviceList.map((svc) => {
                      const errPct = (svc.error_rate * 100).toFixed(2);
                      const isCritical = svc.error_rate > 0.02;
                      return (
                        <tr key={svc.service}>
                          <td style={{ fontWeight: 'var(--weight-medium)' as unknown as number, color: 'var(--text-primary)' }}>{svc.service}</td>
                          <td style={{ color: isCritical ? 'var(--status-critical)' : 'var(--text-secondary)' }}>{errPct}%</td>
                          <td style={{ color: isCritical ? 'var(--status-critical)' : 'var(--text-secondary)' }}>{(svc.error_rate * 650).toFixed(1)}</td>
                          <td><span className={`mon-badge mon-badge--${isCritical ? 'red' : 'green'}`}>{isCritical ? 'Critical' : 'Healthy'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active incidents — real data */}
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <h3 className="mon-section-title">Active incidents</h3>
            {actionError && (
              <div role="alert" style={{ color: 'var(--status-critical)', fontSize: 'var(--text-sm)' }}>{actionError}</div>
            )}
            {incidentList.length === 0 ? (
              <p className="mon-hint">No active incidents.</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {incidentList.map((incident) => (
                  <IncidentRow key={incident.id} id={incident.id} title={incident.title}
                    severity={incident.severity} status={incident.status} owner={incident.owner}
                    createdAt={incident.created_at} onAcknowledge={handleAck} />
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      <style jsx>{`
        .mon-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); }
        .mon-time-range {
          display: flex; gap: 2px; padding: 4px; border-radius: var(--radius-lg);
          background: var(--card-bg); border: 1px solid var(--card-border);
        }
        .mon-time-btn {
          padding: 6px 16px; font-size: var(--text-xs); font-weight: var(--weight-medium);
          color: var(--text-tertiary); background: none; border: none;
          border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;
        }
        .mon-time-btn:hover { color: var(--text-primary); }
        .mon-time-btn--active { background: var(--primary-600); color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,0.25); }
        .mon-export-btn {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px;
          font-size: var(--text-sm); color: var(--text-secondary);
          background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: var(--radius-md); cursor: pointer; transition: background 0.15s;
        }
        .mon-export-btn:hover { background: var(--surface-tertiary); }
        .mon-service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
        .mon-section-title { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); }
        .mon-hint { font-size: var(--text-sm); color: var(--text-tertiary); }
        .mon-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-xl); overflow: hidden; }
        .mon-card-header {
          padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface-tertiary);
        }
        .mon-card-title { font-weight: var(--weight-semibold); color: var(--text-primary); }
        .mon-table { width: 100%; border-collapse: collapse; }
        .mon-table thead { background: var(--surface-tertiary); }
        .mon-table th { padding: 8px 16px; text-align: left; font-size: 10px; font-weight: var(--weight-semibold); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
        .mon-table td { padding: 12px 16px; font-size: var(--text-sm); color: var(--text-secondary); border-bottom: 1px solid var(--border-primary); }
        .mon-table tbody tr { transition: background 0.1s; }
        .mon-table tbody tr:hover { background: var(--surface-tertiary); }
        .mon-badge { display: inline-flex; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--weight-semibold); }
        .mon-badge--green { background: rgba(34,197,94,0.12); color: var(--status-healthy); }
        .mon-badge--red { background: rgba(239,68,68,0.12); color: var(--status-critical); }
      `}</style>
    </ModuleShell>
  );
}
