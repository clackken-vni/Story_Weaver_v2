import { useState, useCallback, useMemo } from 'react';
import {
  Clock3,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  ChevronRight,
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
            <button
              type="button"
              onClick={() => setActiveGroup('')}
              style={tabButtonStyle(!activeGroup)}
            >
              General
            </button>
            {groups.map((group) => {
              const metadata = GROUP_LABELS[group];
              const Icon = metadata?.icon;
              const active = activeGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  style={tabButtonStyle(active)}
                >
                  {Icon && <Icon size={14} aria-hidden="true" />}
                  {groupLabel(group)}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-4)', minHeight: 400 }} className="settings-layout">
            <div style={{ display: 'grid', gap: 'var(--space-2)', alignContent: 'start' }}>
              {filteredItems.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No settings in this group.</p>
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
                      <div>
                        <strong>{settingLabel(item.key)}</strong>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                          {item.key} · {item.is_secret ? '●●●●' : item.value} · v{item.version}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
              {selectedItem && selectedSchema && (
                <article
                  style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--card-bg)',
                    padding: 'var(--space-4)',
                    display: 'grid',
                    gap: 'var(--space-3)',
                  }}
                >
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' as unknown as number }}>
                        {selectedItem.key}
                      </h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {selectedSchema.description || 'No description'} · Type: {selectedSchema.type} · v{selectedItem.version}
                      </p>
                    </div>
                    {selectedItem.is_secret && (
                      <button
                        type="button"
                        onClick={() => setShowSecret((prev) => !prev)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                        aria-label={showSecret ? 'Hide secret' : 'Reveal secret'}
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </header>

                  {selectedSchema.type === 'bool' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
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
                      style={{
                        border: '1px solid var(--input-border)',
                        borderRadius: 'var(--input-radius)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        fontSize: 'var(--text-sm)',
                        fontFamily: selectedSchema.type === 'number' ? 'var(--font-mono)' : 'var(--font-ui)',
                      }}
                    />
                  )}

                  {canWrite && (
                    <>
                      <input
                        type="text"
                        placeholder="Reason for change (required)"
                        value={draftReason}
                        onChange={(event) => setDraftReason(event.target.value)}
                        style={{
                          border: '1px solid var(--input-border)',
                          borderRadius: 'var(--input-radius)',
                          background: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          padding: '8px 12px',
                          fontSize: 'var(--text-sm)',
                        }}
                      />
                      {saveError && (
                        <div role="alert" style={{ color: 'var(--status-critical)', fontSize: 'var(--text-sm)' }}>
                          {saveError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !draftReason.trim() || draftValue === selectedItem.value}
                        style={{
                          justifySelf: 'start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          border: '1px solid var(--primary-600)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'linear-gradient(90deg, var(--primary-600), var(--primary-700))',
                          color: '#fff',
                          padding: '8px 16px',
                          fontSize: 'var(--text-sm)',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <Save size={14} aria-hidden="true" />
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowHistory((prev) => !prev)}
                    style={{
                      justifySelf: 'start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-tertiary)',
                      color: 'var(--text-secondary)',
                      padding: '6px 10px',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    <Clock3 size={12} aria-hidden="true" />
                    {showHistory ? 'Hide history' : `Show history (${history.length})`}
                  </button>

                  {showHistory && history.length > 0 && (
                    <div style={{ display: 'grid', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                      {history.map((entry) => (
                        <div
                          key={`${entry.setting_key}-${entry.to_version}`}
                          style={{
                            border: '1px solid var(--card-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-2) var(--space-3)',
                            fontSize: 'var(--text-xs)',
                            display: 'grid',
                            gap: 'var(--space-1)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>
                              v{entry.from_version} → v{entry.to_version}
                            </strong>
                            {canWrite && (
                              <button
                                type="button"
                                onClick={() => handleRollback(entry.to_version)}
                                disabled={saving}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-1)',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'var(--surface-tertiary)',
                                  color: 'var(--text-secondary)',
                                  padding: '2px 6px',
                                  fontSize: 'var(--text-xs)',
                                  cursor: 'pointer',
                                }}
                              >
                                <RotateCcw size={10} aria-hidden="true" />
                                Rollback
                              </button>
                            )}
                          </div>
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            By {entry.changed_by} · {new Date(entry.changed_at).toLocaleString()} · {entry.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )}
            </div>
          </div>

          <style jsx>{`
            .settings-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: 1px solid var(--card-border);
              border-radius: var(--radius-lg);
              background: var(--card-bg);
              padding: var(--space-3);
              cursor: pointer;
              text-align: left;
              color: var(--text-primary);
              font-size: var(--text-sm);
              width: 100%;
              transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
            }
            .settings-item:hover {
              border-color: var(--primary-500);
              background: var(--surface-tertiary);
            }
            .settings-item--selected {
              border-color: var(--primary-500);
              background: var(--table-row-hover);
            }
            @media (max-width: 767px) {
              .settings-layout {
                grid-template-columns: 1fr !important;
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
    border: `1px solid ${active ? 'var(--primary-600)' : 'var(--border-primary)'}`,
    borderRadius: 'var(--radius-lg)',
    background: active ? 'linear-gradient(90deg, var(--primary-600), var(--primary-700))' : 'var(--surface-secondary)',
    color: active ? '#ffffff' : 'var(--text-secondary)',
    padding: '8px 12px',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };
}
