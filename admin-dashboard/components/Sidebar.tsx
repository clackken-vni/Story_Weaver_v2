import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
}

export function Sidebar({ items, activeId, collapsed, onSelect }: SidebarProps) {
  return (
    <nav aria-label="Main navigation" style={{ flex: 1, overflow: 'auto', padding: 'var(--space-3)' }}>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          return (
            <li key={item.id}>
              <button
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? ('var(--weight-semibold)' as unknown as number) : ('var(--weight-medium)' as unknown as number),
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  transition: `all var(--duration-fast) var(--ease-out)`,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  textAlign: 'left',
                  boxShadow: isActive ? 'var(--shadow-lg)' : 'none',
                }}
                className="sidebar-nav-btn"
              >
                <Icon size={18} style={{ flexShrink: 0 }} />

                {!collapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)' as unknown as number,
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--status-critical)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .sidebar-nav-btn:hover {
          background: var(--sidebar-item-hover);
          color: var(--text-primary);
        }

        .sidebar-nav-btn:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 0;
        }
      `}</style>
    </nav>
  );
}
