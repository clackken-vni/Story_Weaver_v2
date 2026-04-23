import type { CSSProperties, ReactNode } from 'react';

interface NeoPrintButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  ariaLabel?: string;
  style?: CSSProperties;
}

const VARIANT_STYLE: Record<NonNullable<NeoPrintButtonProps['variant']>, CSSProperties> = {
  primary: {
    background: 'var(--np-accent)',
    color: '#f5f1ea',
    borderColor: 'var(--np-accent)',
  },
  secondary: {
    background: 'var(--np-surface)',
    color: 'var(--np-ink)',
    borderColor: 'var(--np-line)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--np-ink)',
    borderColor: 'var(--np-line)',
  },
  danger: {
    background: 'var(--status-critical-bg)',
    color: 'var(--status-critical)',
    borderColor: 'var(--status-critical)',
  },
};

export function NeoPrintButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'secondary',
  ariaLabel,
  style,
}: NeoPrintButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        minHeight: 36,
        padding: '8px 14px',
        border: '1px solid',
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        opacity: disabled ? 0.55 : 1,
        transition: 'transform var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)',
        ...VARIANT_STYLE[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
