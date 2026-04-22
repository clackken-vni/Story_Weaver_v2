import { describe, it, expect } from '@jest/globals';

type TabType =
  | 'command-center'
  | 'users-access'
  | 'projects-wizard'
  | 'ai-operations'
  | 'tts-operations'
  | 'kb-operations'
  | 'audit-compliance'
  | 'system-infra';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  notificationCountMap?: Partial<Record<TabType, number>>;
}

function NavigationTabs({ activeTab, onTabChange, notificationCountMap }: NavigationTabsProps) {
  const tabs: { id: TabType; label: string; icon?: string }[] = [
    { id: 'command-center', label: 'Command Center', icon: '🎯' },
    { id: 'users-access', label: 'Users & Access', icon: '👥' },
    { id: 'projects-wizard', label: 'Projects & Wizard', icon: '📖' },
    { id: 'ai-operations', label: 'AI Operations', icon: '🤖' },
    { id: 'tts-operations', label: 'TTS Operations', icon: '🔊' },
    { id: 'kb-operations', label: 'KB Operations', icon: '📚' },
    { id: 'audit-compliance', label: 'Audit & Compliance', icon: '🔍' },
    { id: 'system-infra', label: 'System & Infra', icon: '⚙️' },
  ];

  const navItems = tabs.map(tab => {
    const isActive = tab.id === activeTab;
    const count = notificationCountMap?.[tab.id];
    const showBadge = count !== undefined && count > 0;
    return `
      <button
        class="nav-tab ${isActive ? 'active' : ''}"
        data-tab="${tab.id}"
        role="tab"
        aria-selected="${isActive}"
      >
        ${tab.icon} ${tab.label}
        ${showBadge ? `<span class="badge">${count}</span>` : ''}
      </button>
    `;
  }).join('');

  return `<nav class="navigation-tabs" role="tablist">${navItems}</nav>`;
}

describe('NavigationTabs (8-module IA)', () => {
  it('should render all 8 module tabs', () => {
    const html = NavigationTabs({ activeTab: 'command-center', onTabChange: () => {} });
    expect(html).toContain('Command Center');
    expect(html).toContain('Users & Access');
    expect(html).toContain('Projects & Wizard');
    expect(html).toContain('AI Operations');
    expect(html).toContain('TTS Operations');
    expect(html).toContain('KB Operations');
    expect(html).toContain('Audit & Compliance');
    expect(html).toContain('System & Infra');
  });

  it('should have exactly 8 tabs', () => {
    const html = NavigationTabs({ activeTab: 'command-center', onTabChange: () => {} });
    const tabMatches = html.match(/data-tab="/g) || [];
    expect(tabMatches.length).toBe(8);
  });

  it('should mark active tab correctly', () => {
    const html = NavigationTabs({ activeTab: 'audit-compliance', onTabChange: () => {} });
    expect(html).toContain('data-tab="audit-compliance"');
    const activeTabs = html.match(/class="nav-tab active"/g) || [];
    expect(activeTabs.length).toBe(1);
  });

  it('should show notification badge from countMap', () => {
    const html = NavigationTabs({
      activeTab: 'command-center',
      onTabChange: () => {},
      notificationCountMap: { 'command-center': 3 },
    });
    expect(html).toContain('badge');
    expect(html).toContain('3');
  });

  it('should not show badge when count is 0', () => {
    const html = NavigationTabs({
      activeTab: 'command-center',
      onTabChange: () => {},
      notificationCountMap: { 'command-center': 0 },
    });
    expect(html).not.toContain('badge');
  });

  it('should use role=tablist and role=tab', () => {
    const html = NavigationTabs({ activeTab: 'command-center', onTabChange: () => {} });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
  });

  it('should set aria-selected on active tab', () => {
    const html = NavigationTabs({ activeTab: 'system-infra', onTabChange: () => {} });
    expect(html).toContain('aria-selected="true"');
  });
});
