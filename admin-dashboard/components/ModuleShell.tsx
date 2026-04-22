import { ReactNode } from 'react';
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
    <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{subtitle}</p>
          )}
        </div>
        {actions && <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>{actions}</div>}
      </header>

      {loading && (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }} aria-label="Module loading state">
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
        </div>
      )}

      {!loading && error && (
        <article
          style={{
            border: '1px solid var(--status-critical)',
            background: 'var(--status-critical-bg)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--space-4)',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
          role="alert"
        >
          <strong style={{ color: 'var(--status-critical)', fontSize: 'var(--text-sm)' }}>Failed to load module</strong>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                justifySelf: 'start',
                border: '1px solid var(--border-primary)',
                background: 'var(--surface-tertiary)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </article>
      )}

      {!loading && !error && permissionDenied && (
        <article
          style={{
            border: '1px solid var(--status-degraded)',
            background: 'var(--status-degraded-bg)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--space-4)',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
        >
          <strong style={{ color: 'var(--status-degraded)', fontSize: 'var(--text-sm)' }}>Permission denied</strong>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            You do not have permission to access this module.
          </p>
          <button
            type="button"
            style={{
              justifySelf: 'start',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-tertiary)',
              color: 'var(--text-secondary)',
              padding: '6px 10px',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Request access
          </button>
        </article>
      )}

      {!loading && !error && !permissionDenied && emptyState && (
        <article
          style={{
            border: '1px dashed var(--border-primary)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--surface-secondary)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            display: 'grid',
            gap: 'var(--space-2)',
            justifyItems: 'center',
          }}
        >
          <strong style={{ fontSize: 'var(--text-base)' }}>{emptyState.title}</strong>
          {emptyState.description && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{emptyState.description}</p>
          )}
          {emptyState.actionLabel && emptyState.onAction && (
            <button
              type="button"
              onClick={emptyState.onAction}
              style={{
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-tertiary)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              {emptyState.actionLabel}
            </button>
          )}
        </article>
      )}

      {!loading && !error && !permissionDenied && !emptyState && children}
    </section>
  );
}
