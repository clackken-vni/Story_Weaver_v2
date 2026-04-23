import { useMemo, useState, useCallback } from 'react';
import {
  Clock3,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Shield,
  Wifi,
  Bot,
  Volume2,
  BookOpen,
  Server,
  ToggleLeft,
  Lock,
} from 'lucide-react';
import { ModuleShell } from './ModuleShell';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { useSettings } from '../hooks/useSettings';
import { NeoPrintButton, NeoPrintCard, NeoPrintTag } from './neo-print';

const GROUP_LABELS: Record<string, { label: string; icon: typeof Shield }> = {
  auth: { label: 'Authentication', icon: Shield },
  gateway: { label: 'API Gateway', icon: Wifi },
  ai: { label: 'AI Providers', icon: Bot },
  tts: { label: 'TTS Providers', icon: Volume2 },
  kb: { label: 'Knowledge Base', icon: BookOpen },
  infra: { label: 'Infrastructure', icon: Server },
  feature_flags: { label: 'Feature Flags', icon: ToggleLeft },
  security: { label: 'Security', icon: Lock },
};

function groupLabel(group: string): string {
  return GROUP_LABELS[group]?.label ?? group;
}

function settingLabel(key: string): string {
  const labels: Record<string, string> = {
    'auth.access_token_ttl_minutes': 'Access Token TTL',
    'auth.refresh_token_ttl_minutes': 'Refresh Token TTL',
    'gateway.rate_limit_per_minute': 'Rate Limit / Minute',
    'security.password_min_length': 'Min Password Length',
    'security.jwt_secret': 'JWT Secret',
    'feature.settings_center_enabled': 'Settings Center',
    'ai.default_provider': 'Default AI Provider',
    'tts.default_provider': 'Default TTS Provider',
    'infra.nats_url': 'NATS URL',
    'infra.redis_url': 'Redis URL',
  };
  return labels[key] ?? key.split('.').pop()?.replace(/_/g, ' ') ?? key;
}

interface SettingsPanelProps {
  canWrite: boolean;
}

export function SettingsPanel({ canWrite }: SettingsPanelProps) {
  const {
    schemas,
    items,
    selectedKey,
    history,
    loading,
    saving,
    error,
    saveError,
    groups,
    activeGroup,
    setActiveGroup,
    selectSetting,
    saveSetting,
    doRollback,
    refresh,
  } = useSettings();

  const [draftValue, setDraftValue] = useState('');
  const [draftReason, setDraftReason] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const selectedItem = useMemo(() => items.find((item) => item.key === selectedKey), [items, selectedKey]);
  const selectedSchema = useMemo(() => schemas.find((schema) => schema.key === selectedKey), [schemas, selectedKey]);

  const filteredItems = useMemo(
    () => (activeGroup ? items.filter((item) => item.group === activeGroup) : items),
    [items, activeGroup]
  );

  const handleSelect = useCallback(
    (key: string) => {
      const item = items.find((entry) => entry.key === key);
      setDraftValue(item?.value ?? '');
      setDraftReason('');
      setShowSecret(false);
      setShowHistory(false);
      void selectSetting(key);
    },
    [items, selectSetting]
  );

  const handleSave = useCallback(async () => {
    if (!selectedKey || !draftReason.trim()) {
      return;
    }
    await saveSetting(selectedKey, draftValue, draftReason);
    setDraftReason('');
  }, [selectedKey, draftReason, draftValue, saveSetting]);

  const handleRollback = useCallback(
    async (version: number) => {
      if (!selectedKey) {
        return;
      }
      await doRollback(selectedKey, version, `UI rollback to v${version}`);
    },
    [selectedKey, doRollback]
  );

  return (
    <ModuleShell
      title="Settings"
      subtitle="Manage system configuration"
      loading={false}
      error={error}
      onRetry={refresh}
    >
      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
        </div>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            <button type="button" onClick={() => setActiveGroup('')} style={tabButtonStyle(!activeGroup)}>
              General
            </button>
            {groups.map((group) => {
              const metadata = GROUP_LABELS[group];
              const Icon = metadata?.icon;
              const active = activeGroup === group;
              return (
                <button key={group} type="button" onClick={() => setActiveGroup(group)} style={tabButtonStyle(active)}>
                  {Icon ? <Icon size={14} aria-hidden="true" /> : null}
                  {groupLabel(group)}
                </button>
              );
            })}
          </div>

          <div className="settings-layout">
            <div style={{ display: 'grid', gap: 'var(--space-2)', alignContent: 'start' }}>
              {filteredItems.length === 0 ? (
                <NeoPrintCard>
                  <p className="settings-copy">No settings in this group.</p>
                </NeoPrintCard>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedKey === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelect(item.key)}
                      className={`settings-item ${isSelected ? 'settings-item--selected' : ''}`}
                    >
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong className="settings-item-title">{settingLabel(item.key)}</strong>
                        <div className="settings-item-meta">
                          {item.key} · {item.is_secret ? '●●●●' : item.value} · v{item.version}
                        </div>
                      </div>
                      <NeoPrintTag tone={item.is_secret ? 'accent' : 'default'}>{item.is_secret ? 'secret' : item.group}</NeoPrintTag>
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
              {selectedItem && selectedSchema ? (
                <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                      <p className="settings-kicker">Selected key</p>
                      <h3 className="settings-title">{selectedItem.key}</h3>
                      <p className="settings-copy">
                        {selectedSchema.description || 'No description'} · Type: {selectedSchema.type} · v{selectedItem.version}
                      </p>
                    </div>
                    {selectedItem.is_secret ? (
                      <NeoPrintButton
                        type="button"
                        variant="secondary"
                        onClick={() => setShowSecret((prev) => !prev)}
                        ariaLabel={showSecret ? 'Hide secret' : 'Reveal secret'}
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showSecret ? 'Hide' : 'Reveal'}
                      </NeoPrintButton>
                    ) : null}
                  </header>

                  {selectedSchema.type === 'bool' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--np-ink)' }}>
                      <input
                        type="checkbox"
                        checked={draftValue === 'true'}
                        onChange={(event) => setDraftValue(event.target.checked ? 'true' : 'false')}
                        disabled={!canWrite}
                      />
                      {draftValue === 'true' ? 'Enabled' : 'Disabled'}
                    </label>
                  ) : (
                    <input
                      type={selectedItem.is_secret && !showSecret ? 'password' : 'text'}
                      value={draftValue}
                      onChange={(event) => setDraftValue(event.target.value)}
                      disabled={!canWrite}
                      className="settings-input"
                    />
                  )}

                  {canWrite ? (
                    <>
                      <input
                        type="text"
                        placeholder="Reason for change (required)"
                        value={draftReason}
                        onChange={(event) => setDraftReason(event.target.value)}
                        className="settings-input"
                      />
                      {saveError ? (
                        <div role="alert">
                          <NeoPrintCard tone="danger">
                            <p className="settings-copy" style={{ color: 'var(--status-critical)' }}>{saveError}</p>
                          </NeoPrintCard>
                        </div>
                      ) : null}
                      <NeoPrintButton
                        type="button"
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving || !draftReason.trim() || draftValue === selectedItem.value}
                        style={{ justifySelf: 'start' }}
                      >
                        <Save size={14} aria-hidden="true" />
                        {saving ? 'Saving...' : 'Save changes'}
                      </NeoPrintButton>
                    </>
                  ) : (
                    <NeoPrintCard tone="accent">
                      <p className="settings-copy">You have read-only access to this settings ledger.</p>
                    </NeoPrintCard>
                  )}

                  <NeoPrintButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowHistory((prev) => !prev)}
                    style={{ justifySelf: 'start' }}
                  >
                    <Clock3 size={12} aria-hidden="true" />
                    {showHistory ? 'Hide history' : `Show history (${history.length})`}
                  </NeoPrintButton>

                  {showHistory && history.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                      {history.map((entry) => (
                        <NeoPrintCard key={`${entry.setting_key}-${entry.to_version}`} style={{ display: 'grid', gap: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <strong className="settings-item-title">
                              v{entry.from_version} → v{entry.to_version}
                            </strong>
                            {canWrite ? (
                              <NeoPrintButton
                                type="button"
                                variant="ghost"
                                onClick={() => handleRollback(entry.to_version)}
                                disabled={saving}
                              >
                                <RotateCcw size={10} aria-hidden="true" />
                                Rollback
                              </NeoPrintButton>
                            ) : null}
                          </div>
                          <span className="settings-item-meta">
                            By {entry.changed_by} · {new Date(entry.changed_at).toLocaleString()} · {entry.reason}
                          </span>
                        </NeoPrintCard>
                      ))}
                    </div>
                  ) : null}
                </NeoPrintCard>
              ) : (
                <NeoPrintCard>
                  <p className="settings-copy">Select a setting from the left ledger to inspect or update it.</p>
                </NeoPrintCard>
              )}
            </div>
          </div>

          <style jsx>{`
            .settings-layout {
              display: grid;
              grid-template-columns: 300px 1fr;
              gap: var(--space-4);
              min-height: 400px;
            }

            .settings-kicker,
            .settings-item-meta {
              font-size: 11px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--np-muted);
            }

            .settings-title,
            .settings-item-title {
              font-family: var(--np-font-display);
              color: var(--np-ink);
            }

            .settings-title {
              margin-top: 6px;
              font-size: clamp(1.7rem, 1.45rem + 0.45vw, 2.15rem);
              line-height: 0.95;
            }

            .settings-item-title {
              font-size: 1.1rem;
              line-height: 0.96;
            }

            .settings-copy {
              font-size: var(--text-sm);
              line-height: 1.6;
              color: var(--np-muted);
            }

            .settings-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: 1px solid var(--np-line);
              background: var(--np-surface);
              padding: var(--space-3);
              cursor: pointer;
              text-align: left;
              width: 100%;
              gap: var(--space-3);
            }

            .settings-item:hover,
            .settings-item--selected {
              background: var(--np-surface-muted);
            }

            .settings-input {
              border: 1px solid var(--np-line);
              background: var(--np-surface);
              color: var(--np-ink);
              padding: 10px 12px;
              font-size: var(--text-sm);
              outline: none;
              min-height: 40px;
            }

            .settings-input:focus {
              border-color: var(--np-accent);
              box-shadow: inset 0 0 0 1px var(--np-accent);
            }

            @media (max-width: 767px) {
              .settings-layout {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </section>
      )}
    </ModuleShell>
  );
}

function tabButtonStyle(active: boolean) {
  return {
    border: `1px solid ${active ? 'var(--np-accent)' : 'var(--np-line)'}`,
    background: active ? 'var(--np-accent)' : 'var(--np-surface)',
    color: active ? '#ffffff' : 'var(--np-ink)',
    padding: '8px 12px',
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  } as const;
}
