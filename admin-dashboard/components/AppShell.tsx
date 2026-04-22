import { useState, useCallback, type ReactNode, useEffect } from 'react';
import { Sidebar, type NavItem } from './Sidebar';
import {
  Crosshair,
  Users,
  BookOpen,
  Bot,
  Volume2,
  Library,
  Search,
  Settings,
  Sliders,
  LogOut,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';

export type ModuleId =
  | 'command-center'
  | 'users-access'
  | 'projects-wizard'
  | 'ai-operations'
  | 'tts-operations'
  | 'kb-operations'
  | 'audit-compliance'
  | 'system-infra'
  | 'settings-center';

const NAV_ITEMS: NavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: Crosshair },
  { id: 'system-infra', label: 'Monitoring', icon: Settings },
  { id: 'audit-compliance', label: 'Audit Logs', icon: Search },
  { id: 'users-access', label: 'Users & Access', icon: Users },
  { id: 'settings-center', label: 'Settings', icon: Sliders },
  { id: 'projects-wizard', label: 'Projects & Wizard', icon: BookOpen },
  { id: 'ai-operations', label: 'AI Operations', icon: Bot },
  { id: 'tts-operations', label: 'TTS Operations', icon: Volume2 },
  { id: 'kb-operations', label: 'KB Operations', icon: Library },
];

interface AppShellProps {
  activeModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
  onLogout: () => void;
  children: ReactNode;
}

function moduleTitle(activeModule: ModuleId): string {
  const target = NAV_ITEMS.find((item) => item.id === activeModule);
  return target?.label ?? 'Admin';
}

export function AppShell({ activeModule, onModuleChange, onLogout, children }: AppShellProps) {
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

  const handleModuleChange = useCallback(
    (id: string) => {
      onModuleChange(id as ModuleId);
      setMobileOpen(false);
    },
    [onModuleChange]
  );

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-primary)' }}>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'var(--surface-overlay)', zIndex: 40 }}
          aria-hidden="true"
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-secondary)',
          zIndex: 50,
          transition: `width var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)`,
          display: 'flex',
          flexDirection: 'column',
        }}
        className={`sidebar-desktop ${mobileOpen ? 'mobile-open' : 'mobile-closed'}`}
      >
        <div
          style={{
            height: '4rem',
            display: 'flex',
            alignItems: 'center',
            padding: sidebarCollapsed ? '0 var(--space-4)' : '0 var(--space-5)',
            borderBottom: '1px solid var(--border-secondary)',
            gap: 'var(--space-3)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Crosshair size={18} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: 'var(--text-primary)' }}>
                StoryWeaver
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Admin</div>
            </div>
          )}
        </div>

        <Sidebar items={NAV_ITEMS} activeId={activeModule} collapsed={sidebarCollapsed} onSelect={handleModuleChange} />

        <div
          style={{
            marginTop: 'auto',
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--border-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <button
            onClick={toggleCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              transition: `background var(--duration-fast)`,
              width: '100%',
            }}
            className="sidebar-footer-btn"
          >
            <Menu size={18} />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={onLogout}
            aria-label="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              width: '100%',
            }}
            className="sidebar-footer-btn"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          transition: `margin-left var(--duration-normal) var(--ease-out)`,
          minWidth: 0,
        }}
      >
        <header
          className="mobile-header"
          style={{
            height: '3.5rem',
            display: 'none',
            alignItems: 'center',
            padding: '0 var(--space-4)',
            borderBottom: '1px solid var(--border-secondary)',
            background: 'var(--surface-secondary)',
          }}
        >
          <button
            onClick={toggleMobile}
            aria-label="Toggle menu"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 'var(--space-1)' }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span style={{ marginLeft: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' as unknown as number, fontSize: 'var(--text-base)' }}>
            {moduleTitle(activeModule)}
          </span>
        </header>

        <header
          style={{
            height: '4rem',
            background: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
          }}
          className="desktop-topbar"
        >
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: 'var(--text-primary)' }}>
              {moduleTitle(activeModule)}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Admin operations dashboard</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setDark((prev) => !prev)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                background: 'var(--surface-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                background: 'var(--surface-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--primary-500)' }} />
            </button>
          </div>
        </header>

        <div style={{ padding: 'var(--space-6)' }}>{children}</div>
      </main>

      <style jsx>{`
        .sidebar-footer-btn:hover {
          background: var(--sidebar-item-hover);
          color: var(--text-primary);
        }

        @media (max-width: 767px) {
          .sidebar-desktop {
            width: var(--sidebar-width) !important;
          }

          .sidebar-desktop.mobile-closed {
            transform: translateX(-100%) !important;
            visibility: hidden;
            pointer-events: none;
          }

          .sidebar-desktop.mobile-open {
            transform: translateX(0) !important;
            visibility: visible;
            pointer-events: auto;
          }

          main {
            margin-left: 0 !important;
          }

          .mobile-header {
            display: flex !important;
          }

          .desktop-topbar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
