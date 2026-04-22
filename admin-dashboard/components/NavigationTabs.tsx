export type TabType =
  | 'command-center'
  | 'users-access'
  | 'projects-wizard'
  | 'ai-operations'
  | 'tts-operations'
  | 'kb-operations'
  | 'audit-compliance'
  | 'system-infra';

export interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  notificationCountMap?: Partial<Record<TabType, number>>;
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'command-center', label: 'Command Center', icon: '🎯' },
  { id: 'users-access', label: 'Users & Access', icon: '👥' },
  { id: 'projects-wizard', label: 'Projects & Wizard', icon: '📖' },
  { id: 'ai-operations', label: 'AI Operations', icon: '🤖' },
  { id: 'tts-operations', label: 'TTS Operations', icon: '🔊' },
  { id: 'kb-operations', label: 'KB Operations', icon: '📚' },
  { id: 'audit-compliance', label: 'Audit & Compliance', icon: '🔍' },
  { id: 'system-infra', label: 'System & Infra', icon: '⚙️' },
];

export function NavigationTabs({ activeTab, onTabChange, notificationCountMap }: NavigationTabsProps) {
  return (
    <nav className="navigation-tabs flex gap-1 border-b pb-2 overflow-x-auto" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const count = notificationCountMap?.[tab.id];
        const showBadge = count !== undefined && count > 0;

        return (
          <button
            key={tab.id}
            className={`nav-tab px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
              isActive ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-tab={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon} {tab.label}
            {showBadge && (
              <span className="badge ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
