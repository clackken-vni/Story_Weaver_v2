import type { Envelope } from './contracts';
import { adminApi } from './api';

export interface SettingItem {
  key: string;
  group: string;
  value: string;
  is_secret: boolean;
  version: number;
  updated_by: string;
  updated_at: string;
}

export interface SettingSchemaItem {
  key: string;
  group: string;
  type: 'string' | 'number' | 'bool' | 'json' | 'select';
  required: boolean;
  constraints?: string[];
  is_secret: boolean;
  mask_strategy?: string;
  hot_reload_supported: boolean;
  description?: string;
}

export interface SettingHistoryEntry {
  setting_key: string;
  from_version: number;
  to_version: number;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  reason: string;
  trace_id: string;
}

export async function fetchSettingsSchema(): Promise<SettingSchemaItem[]> {
  const res = await adminApi.request<Envelope<{ items: SettingSchemaItem[] }>>('/api/v1/admin/settings/schema');
  return res.data?.items ?? [];
}

export async function fetchSettings(group?: string, query?: string): Promise<SettingItem[]> {
  const params = new URLSearchParams();
  if (group) params.set('group', group);
  if (query) params.set('q', query);
  const qs = params.toString();
  const res = await adminApi.request<Envelope<{ items: SettingItem[] }>>(`/api/v1/admin/settings${qs ? `?${qs}` : ''}`);
  return res.data?.items ?? [];
}

export async function fetchSetting(key: string): Promise<SettingItem> {
  const res = await adminApi.request<Envelope<SettingItem>>(`/api/v1/admin/settings/${encodeURIComponent(key)}`);
  return res.data;
}

export async function updateSetting(key: string, value: string, reason: string): Promise<SettingItem> {
  const res = await adminApi.request<Envelope<SettingItem>>(`/api/v1/admin/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value, reason }),
  });
  return res.data;
}

export async function fetchSettingsHistory(key: string): Promise<SettingHistoryEntry[]> {
  const res = await adminApi.request<Envelope<{ items: SettingHistoryEntry[] }>>(`/api/v1/admin/settings/history?key=${encodeURIComponent(key)}`);
  return res.data?.items ?? [];
}

export async function rollbackSetting(key: string, version: number, reason: string): Promise<SettingItem> {
  const res = await adminApi.request<Envelope<SettingItem>>(`/api/v1/admin/settings/${encodeURIComponent(key)}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ version, reason }),
  });
  return res.data;
}
