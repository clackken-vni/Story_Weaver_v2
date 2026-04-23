import type { ReactNode } from 'react';

interface NeoPrintShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  mobileHeader?: ReactNode;
  overlay?: ReactNode;
  sidebarWidth: string;
  mobileSidebarOpen: boolean;
  children: ReactNode;
}

export function NeoPrintShell({
  sidebar,
  header,
  mobileHeader,
  overlay,
  sidebarWidth,
  mobileSidebarOpen,
  children,
}: NeoPrintShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--np-bg)', color: 'var(--np-ink)' }}>
      {overlay}
      {sidebar}
      <main
        style={{
          minWidth: 0,
          marginLeft: sidebarWidth,
          transition: 'margin-left var(--duration-normal) var(--ease-out)',
        }}
        className={mobileSidebarOpen ? 'np-shell-main np-shell-main--mobile-open' : 'np-shell-main'}
      >
        {mobileHeader}
        {header}
        <div style={{ padding: 'var(--space-6)' }}>{children}</div>
      </main>

      <style jsx>{`
        @media (max-width: 767px) {
          .np-shell-main,
          .np-shell-main--mobile-open {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
