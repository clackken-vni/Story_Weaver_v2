import { ReactNode } from 'react';
import { NeoPrintButton, NeoPrintCard, NeoPrintModuleHero, NeoPrintSection } from './neo-print';
import { SkeletonLoader } from './ui/SkeletonLoader';

export interface ModuleShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  permissionDenied?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

export function ModuleShell({
  title,
  subtitle,
  actions,
  children,
  loading,
  error,
  onRetry,
  permissionDenied,
  emptyState,
}: ModuleShellProps) {
  return (
    <NeoPrintSection>
      <NeoPrintModuleHero
        title={title}
        kicker="Module dispatch"
        strapline={subtitle ?? 'Operational view rendered with the Neo-Print editorial shell.'}
        edition="Field Notes"
        actions={actions}
      />

      {loading && (
        <NeoPrintCard>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }} aria-label="Module loading state">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="row" />
            <SkeletonLoader variant="row" />
          </div>
        </NeoPrintCard>
      )}

      {!loading && error && (
        <div role="alert">
          <NeoPrintCard tone="danger">
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <strong style={{ color: 'var(--status-critical)', fontSize: 'var(--text-sm)' }}>Failed to load module</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{error}</p>
              {onRetry ? (
                <div>
                  <NeoPrintButton variant="danger" onClick={onRetry}>
                    Retry
                  </NeoPrintButton>
                </div>
              ) : null}
            </div>
          </NeoPrintCard>
        </div>
      )}

      {!loading && !error && permissionDenied && (
        <NeoPrintCard tone="accent">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <strong style={{ color: 'var(--status-degraded)', fontSize: 'var(--text-sm)' }}>Permission denied</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              You do not have permission to access this module.
            </p>
            <div>
              <NeoPrintButton variant="secondary">Request access</NeoPrintButton>
            </div>
          </div>
        </NeoPrintCard>
      )}

      {!loading && !error && !permissionDenied && emptyState && (
        <NeoPrintCard>
          <div style={{ display: 'grid', gap: 'var(--space-3)', justifyItems: 'center', textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <strong style={{ fontSize: 'var(--text-base)', color: 'var(--np-ink)' }}>{emptyState.title}</strong>
            {emptyState.description ? (
              <p style={{ color: 'var(--np-muted)', fontSize: 'var(--text-sm)', maxWidth: 480 }}>{emptyState.description}</p>
            ) : null}
            {emptyState.actionLabel && emptyState.onAction ? (
              <NeoPrintButton variant="secondary" onClick={emptyState.onAction}>
                {emptyState.actionLabel}
              </NeoPrintButton>
            ) : null}
          </div>
        </NeoPrintCard>
      )}

      {!loading && !error && !permissionDenied && !emptyState ? children : null}
    </NeoPrintSection>
  );
}
