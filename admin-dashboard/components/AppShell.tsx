import { useState, useCallback, type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Bot, Crosshair, Library, Menu, Search, Settings, Sliders, Users, Volume2, X } from 'lucide-react';
import {
  NeoPrintShell,
  NeoPrintSidebar,
  type NeoPrintSidebarItem,
} from './neo-print';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

const SIDEBAR_ITEMS: NeoPrintSidebarItem[] = [
  { id: 'command-center', label: 'Command Center', shortLabel: 'CC', icon: Crosshair, href: '/admin' },
  { id: 'system-infra', label: 'Monitoring', shortLabel: 'MN', icon: Settings, href: '/admin/monitoring' },
  { id: 'audit-compliance', label: 'Audit Logs', shortLabel: 'AL', icon: Search, href: '/admin/audit' },
  { id: 'users-access', label: 'Users & Access', shortLabel: 'UA', icon: Users, href: '/admin/users' },
  { id: 'settings-center', label: 'Settings', shortLabel: 'ST', icon: Sliders, href: '/admin/settings' },
  { id: 'projects-wizard', label: 'Projects & Wizard', shortLabel: 'PW', icon: BookOpen, href: '/admin/projects' },
  { id: 'ai-operations', label: 'AI Operations', shortLabel: 'AI', icon: Bot, href: '/admin/ai' },
  { id: 'tts-operations', label: 'TTS Operations', shortLabel: 'TS', icon: Volume2, href: '/admin/tts' },
  { id: 'kb-operations', label: 'KB Operations', shortLabel: 'KB', icon: Library, href: '/admin/kb' },
];

export const NAV_ITEMS: NavItem[] = SIDEBAR_ITEMS.map(({ shortLabel: _shortLabel, ...item }) => item);

export type ModuleId = typeof NAV_ITEMS[number]['id'];

interface AppShellProps {
  onLogout: () => void;
  children: ReactNode;
}

function getModuleMeta(pathname: string): { id: ModuleId; label: string } {
  const activeItem = NAV_ITEMS.find((item) => pathname === item.href);
  return {
    id: activeItem?.id ?? 'command-center',
    label: activeItem?.label ?? 'Admin',
  };
}

export function AppShell({ onLogout, children }: AppShellProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
      setDark(true);
      return;
    }
    if (savedTheme === 'light') {
      setDark(false);
      return;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('admin_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const moduleMeta = getModuleMeta(router.pathname);
  const sidebarWidth = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  return (
    <>
      <NeoPrintShell
        sidebarWidth={sidebarWidth}
        mobileSidebarOpen={mobileOpen}
        overlay={
          mobileOpen ? (
            <div
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'var(--surface-overlay)', zIndex: 40 }}
              aria-hidden="true"
              className="np-mobile-overlay"
            />
          ) : undefined
        }
        sidebar={
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: sidebarWidth,
              zIndex: 50,
              transition: 'width var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)',
            }}
            className={`np-sidebar-shell ${mobileOpen ? 'np-sidebar-shell--open' : 'np-sidebar-shell--closed'}`}
          >
            <NeoPrintSidebar
              items={SIDEBAR_ITEMS}
              activeHref={router.pathname}
              collapsed={sidebarCollapsed}
              themeLabel={dark ? 'Switch to light edition' : 'Switch to dark edition'}
              onThemeToggle={() => setDark((prev) => !prev)}
              onCollapseToggle={toggleCollapsed}
              onLogout={onLogout}
            />
          </aside>
        }
        mobileHeader={
          <header
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--np-line)',
              background: 'var(--np-surface)',
            }}
            className="np-mobile-header"
          >
            <button
              type="button"
              onClick={toggleMobile}
              aria-label="Toggle menu"
              style={{ border: '1px solid var(--np-line)', background: 'transparent', color: 'var(--np-ink)', width: 40, height: 40, cursor: 'pointer' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--np-muted)' }}>Current desk</div>
              <div style={{ fontFamily: 'var(--np-font-display)', fontSize: '1.15rem', color: 'var(--np-ink)' }}>{moduleMeta.label}</div>
            </div>
          </header>
        }
        header={null}
      >
        {children}
      </NeoPrintShell>

      <style jsx>{`
        @media (max-width: 767px) {
          .np-sidebar-shell {
            width: var(--sidebar-width) !important;
          }

          .np-sidebar-shell--closed {
            transform: translateX(-100%);
            visibility: hidden;
            pointer-events: none;
          }

          .np-sidebar-shell--open {
            transform: translateX(0);
          }

          .np-mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
