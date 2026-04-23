import { useMemo, useState } from 'react';
import { ModuleShell } from './ModuleShell';
import { useMonitoring } from '../hooks/useMonitoring';
import { ServiceCard } from './ui/ServiceCard';
import { InfraStrip } from './ui/InfraStrip';
import { IncidentRow } from './ui/IncidentRow';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { adminApi } from '../lib/api';
import { NeoPrintButton, NeoPrintCard, NeoPrintStatGrid, NeoPrintTable, NeoPrintTag } from './neo-print';

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
          <NeoPrintStatGrid>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </NeoPrintStatGrid>
          <SkeletonLoader variant="text" lines={3} />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <div className="mon-toolbar">
            <div className="mon-time-range" role="tablist" aria-label="Monitoring time range">
              {TIME_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`mon-time-btn ${timeRange === range ? 'mon-time-btn--active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            <NeoPrintButton type="button" variant="secondary">Export</NeoPrintButton>
          </div>

          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="mon-heading-row">
              <div>
                <p className="mon-kicker">Operations board</p>
                <h3 className="mon-title">Service matrix</h3>
              </div>
              <NeoPrintTag tone={serviceList.some((service) => service.status !== 'healthy') ? 'degraded' : 'healthy'}>
                {serviceList.length} services
              </NeoPrintTag>
            </div>
            {serviceList.length === 0 ? (
              <NeoPrintCard>
                <p className="mon-copy">No services reporting yet. Data will appear when monitoring endpoints are connected.</p>
              </NeoPrintCard>
            ) : (
              <NeoPrintStatGrid>
                {serviceList.map((service) => (
                  <ServiceCard
                    key={service.service}
                    name={service.service}
                    status={service.status}
                    p95LatencyMs={service.p95_latency_ms}
                    errorRate={service.error_rate}
                  />
                ))}
              </NeoPrintStatGrid>
            )}
          </section>

          {infraList.length > 0 ? <InfraStrip items={infraList} /> : null}

          {serviceList.length > 0 ? (
            <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <p className="mon-kicker">Rate table</p>
                <h3 className="mon-title">Error ledger</h3>
              </div>
              <NeoPrintTable
                data={serviceList}
                rowKey={(service) => service.service}
                columns={[
                  {
                    key: 'service',
                    header: 'Service',
                    render: (service) => <strong style={{ color: 'var(--np-ink)' }}>{service.service}</strong>,
                  },
                  {
                    key: 'error-rate',
                    header: 'Error Rate',
                    align: 'right',
                    render: (service) => `${(service.error_rate * 100).toFixed(2)}%`,
                  },
                  {
                    key: 'errors-min',
                    header: 'Errors/Min',
                    align: 'right',
                    render: (service) => (service.error_rate * 650).toFixed(1),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    align: 'right',
                    render: (service) => (
                      <NeoPrintTag tone={service.error_rate > 0.02 ? 'critical' : 'healthy'}>
                        {service.error_rate > 0.02 ? 'Critical' : 'Healthy'}
                      </NeoPrintTag>
                    ),
                  },
                ]}
              />
            </section>
          ) : null}

          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="mon-heading-row">
              <div>
                <p className="mon-kicker">Response queue</p>
                <h3 className="mon-title">Active incidents</h3>
              </div>
              <NeoPrintTag tone={incidentList.length > 0 ? 'critical' : 'healthy'}>
                {incidentList.length > 0 ? `${incidentList.length} open` : 'Clear'}
              </NeoPrintTag>
            </div>
            {actionError ? (
              <div role="alert">
                <NeoPrintCard tone="danger">
                  <p className="mon-copy" style={{ color: 'var(--status-critical)' }}>{actionError}</p>
                </NeoPrintCard>
              </div>
            ) : null}
            {incidentList.length === 0 ? (
              <NeoPrintCard>
                <p className="mon-copy">No active incidents.</p>
              </NeoPrintCard>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {incidentList.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    id={incident.id}
                    title={incident.title}
                    severity={incident.severity}
                    status={incident.status}
                    owner={incident.owner}
                    createdAt={incident.created_at}
                    onAcknowledge={handleAck}
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      <style jsx>{`
        .mon-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .mon-time-range {
          display: flex;
          gap: 2px;
          padding: 4px;
          border: 1px solid var(--np-line);
          background: var(--np-surface);
        }

        .mon-time-btn {
          padding: 6px 14px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--np-muted);
          background: transparent;
          border: 0;
          cursor: pointer;
        }

        .mon-time-btn--active {
          background: var(--np-accent);
          color: #f5f1ea;
        }

        .mon-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .mon-kicker {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--np-muted);
        }

        .mon-title {
          margin-top: 6px;
          font-family: var(--np-font-display);
          font-size: clamp(1.7rem, 1.4rem + 0.5vw, 2.2rem);
          line-height: 0.95;
          color: var(--np-ink);
        }

        .mon-copy {
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--np-muted);
        }
      `}</style>
    </ModuleShell>
  );
}
