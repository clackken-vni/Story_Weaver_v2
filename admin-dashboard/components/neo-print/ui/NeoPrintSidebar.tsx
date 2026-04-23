import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { NeoPrintTag } from './NeoPrintTag';

export interface NeoPrintSidebarItem {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface NeoPrintSidebarProps {
  items: NeoPrintSidebarItem[];
  activeHref: string;
  collapsed: boolean;
  themeLabel: string;
  onThemeToggle: () => void;
  onCollapseToggle: () => void;
  onLogout: () => void;
}

export function NeoPrintSidebar({
  items,
  activeHref,
  collapsed,
  themeLabel,
  onThemeToggle,
  onCollapseToggle,
  onLogout,
}: NeoPrintSidebarProps) {
  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 'var(--space-4)',
        gap: 'var(--space-4)',
        background: 'var(--np-surface)',
        borderRight: '1px solid var(--np-line)',
        minWidth: 0,
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-3)', borderBottom: '1px solid var(--np-line)', paddingBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--np-font-display)',
              fontSize: collapsed ? 28 : 34,
              lineHeight: 0.9,
              color: 'var(--np-ink)',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {collapsed ? 'SW' : 'STORYWEAVER'}
          </div>
          {!collapsed ? (
            <div style={{ marginTop: 6, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--np-muted)' }}>
              Neo-Print Admin
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onThemeToggle}
          style={{
            border: '1px solid var(--np-line)',
            background: 'transparent',
            padding: '10px 12px',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'var(--np-ink)',
            width: '100%',
            minWidth: 0,
            overflowWrap: 'anywhere',
          }}
        >
          {collapsed ? 'Mode' : themeLabel}
        </button>
      </div>

      <nav aria-label="Main navigation" style={{ display: 'grid', gap: '8px' }}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              style={{
                textDecoration: 'none',
                border: `1px solid ${isActive ? 'var(--np-accent)' : 'var(--np-line)'}`,
                background: isActive ? 'var(--np-accent-soft)' : 'transparent',
                color: 'var(--np-ink)',
                padding: collapsed ? '12px 8px' : '10px 12px',
                display: 'grid',
                gridTemplateColumns: collapsed ? '1fr' : '18px 1fr auto',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Icon size={16} style={{ justifySelf: 'center' }} />
              {!collapsed ? (
                <span style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', minWidth: 0, overflowWrap: 'anywhere' }}>{item.label}</span>
              ) : null}
              {!collapsed ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {item.badge ? <NeoPrintTag tone="critical">{item.badge}</NeoPrintTag> : null}
                  <span style={{ fontFamily: 'var(--np-font-display)', fontSize: 18, lineHeight: 1, color: 'var(--np-muted)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'grid', gap: '8px', borderTop: '1px solid var(--np-line)', paddingTop: 'var(--space-4)' }}>
        <button type="button" onClick={onCollapseToggle} style={footerButtonStyle}>
          {collapsed ? 'Expand' : 'Collapse grid'}
        </button>
        <button type="button" onClick={onLogout} style={footerButtonStyle}>
          {collapsed ? 'Out' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

const footerButtonStyle = {
  border: '1px solid var(--np-line)',
  background: 'transparent',
  color: 'var(--np-ink)',
  padding: '10px 12px',
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  width: '100%',
  minWidth: 0,
  overflowWrap: 'anywhere' as const,
};
