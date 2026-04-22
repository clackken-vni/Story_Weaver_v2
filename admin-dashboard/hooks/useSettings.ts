import { useState, useEffect, useCallback } from 'react';
import type { SettingItem, SettingSchemaItem, SettingHistoryEntry } from '../lib/settings';
import { fetchSettings, fetchSettingsSchema, fetchSettingsHistory, updateSetting, rollbackSetting } from '../lib/settings';

export interface UseSettingsReturn {
  schemas: SettingSchemaItem[];
  items: SettingItem[];
  selectedKey: string | null;
  history: SettingHistoryEntry[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  groups: string[];
  activeGroup: string;
  setActiveGroup: (group: string) => void;
  selectSetting: (key: string) => void;
  saveSetting: (key: string, value: string, reason: string) => Promise<boolean>;
  doRollback: (key: string, version: number, reason: string) => Promise<boolean>;
  refresh: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [schemas, setSchemas] = useState<SettingSchemaItem[]>([]);
  const [items, setItems] = useState<SettingItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [history, setHistory] = useState<SettingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schemaList, settingsList] = await Promise.all([
        fetchSettingsSchema(),
        fetchSettings(activeGroup || undefined),
      ]);
      setSchemas(schemaList);
      setItems(settingsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const groups = Array.from(new Set(schemas.map((s) => s.group))).sort();

  const selectSetting = useCallback(async (key: string) => {
    setSelectedKey(key);
    setSaveError(null);
    try {
      const h = await fetchSettingsHistory(key);
      setHistory(h);
    } catch {
      setHistory([]);
    }
  }, []);

  const saveSetting = useCallback(async (key: string, value: string, reason: string): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateSetting(key, value, reason);
      await loadAll();
      const h = await fetchSettingsHistory(key);
      setHistory(h);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save setting');
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadAll]);

  const doRollback = useCallback(async (key: string, version: number, reason: string): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      await rollbackSetting(key, version, reason);
      await loadAll();
      const h = await fetchSettingsHistory(key);
      setHistory(h);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to rollback setting');
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadAll]);

  return {
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
    refresh: loadAll,
  };
}
