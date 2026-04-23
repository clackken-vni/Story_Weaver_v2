import { AlertTriangle, Siren } from 'lucide-react';
import { ModuleShell } from './ModuleShell';
import { useCommandCenter } from '../hooks/useCommandCenter';
import { KpiCard } from './ui/KpiCard';
import { NeoPrintCard, NeoPrintStatGrid, NeoPrintTag } from './neo-print';
import { SkeletonLoader } from './ui/SkeletonLoader';

export function CommandCenterPanel() {
  const { data, loading, error } = useCommandCenter();

  const openIncidents = data?.data.open_incidents ?? 0;
  const degradedServices = data?.data.degraded_services ?? 0;
  const alerts = data?.data.top_alerts ?? [];

  const incidentSeverity = openIncidents >= 5 ? 'critical' : openIncidents > 0 ? 'degraded' : 'healthy';
  const serviceSeverity = degradedServices >= 3 ? 'critical' : degradedServices > 0 ? 'degraded' : 'healthy';

  return (
    <ModuleShell title="Command Center" subtitle="Real-time system overview and analytics" loading={false} error={error}>
      {loading ? (
        <section style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <NeoPrintStatGrid>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </NeoPrintStatGrid>
          <SkeletonLoader variant="text" lines={5} />
        </section>
      ) : !data ? (
        <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)', justifyItems: 'center', textAlign: 'center' }}>
          <AlertTriangle size={24} style={{ color: 'var(--np-muted)' }} aria-hidden="true" />
          <h3 style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.75rem', lineHeight: 0.95, color: 'var(--np-ink)' }}>
            No command center data
          </h3>
          <p style={{ color: 'var(--np-muted)', fontSize: 'var(--text-sm)' }}>Data source has not published metrics yet.</p>
        </NeoPrintCard>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <NeoPrintStatGrid>
            <KpiCard
              label="Open Incidents"
              value={openIncidents}
              severity={incidentSeverity}
              trend={openIncidents > 0 ? 'up' : 'flat'}
              trendLabel={openIncidents > 0 ? 'Needs attention' : 'All clear'}
            />
            <KpiCard
              label="Degraded Services"
              value={degradedServices}
              severity={serviceSeverity}
              trend={degradedServices > 0 ? 'up' : 'flat'}
              trendLabel={degradedServices > 0 ? 'Performance drop' : 'All healthy'}
            />
            <KpiCard
              label="Active Alerts"
              value={alerts.length}
              severity={alerts.length > 0 ? 'degraded' : 'healthy'}
              trend={alerts.length > 0 ? 'up' : 'down'}
              trendLabel={alerts.length > 0 ? 'Escalate soon' : 'Quiet period'}
            />
          </NeoPrintStatGrid>

          <div className="cc-lower-grid">
            <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <p className="cc-kicker">Service brief</p>
                  <h3 className="cc-title">Status ledger</h3>
                </div>
                <NeoPrintTag tone={degradedServices > 0 ? 'degraded' : 'healthy'}>
                  {degradedServices > 0 ? 'Degraded' : 'Healthy'}
                </NeoPrintTag>
              </div>
              <p className="cc-copy">
                {degradedServices === 0
                  ? 'All services operational. No degraded services detected.'
                  : `${degradedServices} service(s) currently degraded. Check Monitoring module for details.`}
              </p>
            </NeoPrintCard>

            <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div>
                <p className="cc-kicker">Alert wire</p>
                <h3 className="cc-title">Active alerts</h3>
              </div>
              {alerts.length === 0 ? (
                <p className="cc-copy">No active alerts at this moment.</p>
              ) : (
                <ul className="cc-alert-list">
                  {alerts.map((alert, index) => (
                    <li key={index} className="cc-alert-item">
                      <Siren size={16} style={{ color: 'var(--status-critical)', marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              )}
            </NeoPrintCard>
          </div>
        </section>
      )}

      <style jsx>{`
        .cc-lower-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .cc-kicker {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--np-muted);
        }

        .cc-title {
          margin-top: 6px;
          font-family: var(--np-font-display);
          font-size: clamp(1.7rem, 1.4rem + 0.5vw, 2.2rem);
          line-height: 0.95;
          color: var(--np-ink);
        }

        .cc-copy {
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--np-muted);
        }

        .cc-alert-list {
          list-style: none;
          display: grid;
          gap: var(--space-3);
        }

        .cc-alert-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--np-line);
          font-size: var(--text-sm);
          color: var(--np-ink);
        }

        @media (max-width: 900px) {
          .cc-lower-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </ModuleShell>
  );
}
