interface SkeletonLoaderProps {
  variant?: 'card' | 'row' | 'text';
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'card', lines = 3, className }: SkeletonLoaderProps) {
  if (variant === 'text') {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{
              height: 12,
              marginBottom: index === lines - 1 ? 0 : 'var(--space-2)',
              width: index === lines - 1 ? '70%' : '100%',
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 'var(--space-3)',
          padding: 'var(--space-3)',
          border: '1px solid var(--table-border)',
          borderRadius: 'var(--radius-md)',
        }}
        aria-hidden="true"
      >
        <div className="skeleton" style={{ height: 14 }} />
        <div className="skeleton" style={{ height: 14 }} />
        <div className="skeleton" style={{ height: 14 }} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-4)',
        background: 'var(--card-bg)',
      }}
      aria-hidden="true"
    >
      <div className="skeleton" style={{ height: 12, width: '42%', marginBottom: 'var(--space-3)' }} />
      <div className="skeleton" style={{ height: 36, width: '55%', marginBottom: 'var(--space-4)' }} />
      <div className="skeleton" style={{ height: 10, width: '35%' }} />
    </div>
  );
}
