import { AlertTriangle, Siren } from 'lucide-react';
import { ModuleShell } from './ModuleShell';
import { useCommandCenter } from '../hooks/useCommandCenter';
import { KpiCard } from './ui/KpiCard';
import { StatusBadge } from './ui/StatusBadge';
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
          <div className="cc-kpi-grid">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
          <SkeletonLoader variant="text" lines={5} />
        </section>
      ) : !data ? (
        <section className="cc-empty">
          <AlertTriangle size={24} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
          <h3 className="cc-empty-title">No command center data</h3>
          <p className="cc-empty-desc">Data source has not published metrics yet.</p>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
          {/* KPI Cards — real data */}
          <div className="cc-kpi-grid">
            <KpiCard label="Open Incidents" value={openIncidents} severity={incidentSeverity}
              trend={openIncidents > 0 ? 'up' : 'flat'} trendLabel={openIncidents > 0 ? 'Needs attention' : 'All clear'} />
            <KpiCard label="Degraded Services" value={degradedServices} severity={serviceSeverity}
              trend={degradedServices > 0 ? 'up' : 'flat'} trendLabel={degradedServices > 0 ? 'Performance drop' : 'All healthy'} />
            <KpiCard label="Active Alerts" value={alerts.length} severity={alerts.length > 0 ? 'degraded' : 'healthy'}
              trend={alerts.length > 0 ? 'up' : 'down'} trendLabel={alerts.length > 0 ? 'Escalate soon' : 'Quiet period'} />
          </div>

          {/* Two-column: Service Status + Quick Actions */}
          <div className="cc-lower-grid">
            {/* Service Status */}
            <div className="cc-card">
              <div className="cc-card-header">
                <h3 className="cc-card-title">Service Status</h3>
                <StatusBadge status={degradedServices > 0 ? 'degraded' : 'healthy'} />
              </div>
              <div className="cc-card-body">
                <p className="cc-hint">
                  {degradedServices === 0
                    ? 'All services operational. No degraded services detected.'
                    : `${degradedServices} service(s) currently degraded. Check Monitoring module for details.`}
                </p>
              </div>
            </div>

            {/* Active Alerts */}
            <div className="cc-card">
              <div className="cc-card-header">
                <h3 className="cc-card-title">Active Alerts</h3>
              </div>
              <div className="cc-card-body">
                {alerts.length === 0 ? (
                  <p className="cc-hint">No active alerts at this moment.</p>
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
              </div>
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .cc-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-5); }
        .cc-lower-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
        @media (max-width: 900px) { .cc-lower-grid { grid-template-columns: 1fr; } }
        .cc-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-xl); overflow: hidden; }
        .cc-card-header {
          padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface-tertiary);
        }
        .cc-card-title { font-weight: var(--weight-semibold); color: var(--text-primary); font-size: var(--text-base); }
        .cc-card-body { padding: var(--space-5); }
        .cc-hint { font-size: var(--text-sm); color: var(--text-tertiary); }
        .cc-alert-list { list-style: none; display: grid; gap: var(--space-3); }
        .cc-alert-item {
          display: flex; align-items: flex-start; gap: var(--space-2);
          padding: var(--space-3); border-radius: var(--radius-md);
          border-left: 3px solid var(--status-critical);
          background: var(--status-critical-bg);
          font-size: var(--text-sm); color: var(--text-secondary);
        }
        .cc-empty {
          border: 1px dashed var(--border-primary); border-radius: var(--radius-xl);
          padding: var(--space-10); text-align: center; background: var(--surface-secondary);
        }
        .cc-empty-title { margin-top: var(--space-3); font-size: var(--text-lg); color: var(--text-primary); }
        .cc-empty-desc { margin-top: var(--space-2); font-size: var(--text-sm); color: var(--text-tertiary); }
      `}</style>
    </ModuleShell>
  );
}
