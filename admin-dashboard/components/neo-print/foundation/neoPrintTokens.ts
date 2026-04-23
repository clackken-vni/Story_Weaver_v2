export interface NeoPrintModuleMeta {
  id: string;
  label: string;
  shortLabel: string;
  kicker: string;
  strapline: string;
  edition: string;
}

const DEFAULT_MODULE: NeoPrintModuleMeta = {
  id: 'admin',
  label: 'Admin',
  shortLabel: 'Admin',
  kicker: 'Operations desk',
  strapline: 'Neo-Print control surface',
  edition: 'Edition 00',
};

const MODULES: Record<string, NeoPrintModuleMeta> = {
  '/admin': {
    id: 'command-center',
    label: 'Command Center',
    shortLabel: 'Desk',
    kicker: 'Live editorial overview',
    strapline: 'System pulse, alerts, and lead metrics',
    edition: 'Edition 01',
  },
  '/admin/monitoring': {
    id: 'monitoring',
    label: 'Monitoring',
    shortLabel: 'Signal',
    kicker: 'Performance bureau',
    strapline: 'Latency, incidents, and infrastructure strip',
    edition: 'Edition 02',
  },
  '/admin/audit': {
    id: 'audit',
    label: 'Audit Logs',
    shortLabel: 'Trace',
    kicker: 'Compliance ledger',
    strapline: 'Events, trace chains, and verification history',
    edition: 'Edition 03',
  },
  '/admin/users': {
    id: 'users',
    label: 'Users & Access',
    shortLabel: 'Access',
    kicker: 'Identity desk',
    strapline: 'Operators, roles, and access posture',
    edition: 'Edition 04',
  },
  '/admin/settings': {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Config',
    kicker: 'System controls',
    strapline: 'Provider toggles, secrets, and rollout rules',
    edition: 'Edition 05',
  },
  '/admin/projects': {
    id: 'projects',
    label: 'Projects & Wizard',
    shortLabel: 'Projects',
    kicker: 'Pipeline sheet',
    strapline: 'Project funnel and wizard orchestration',
    edition: 'Edition 06',
  },
  '/admin/ai': {
    id: 'ai',
    label: 'AI Operations',
    shortLabel: 'AI',
    kicker: 'Provider board',
    strapline: 'Model providers, fallback lanes, and token flow',
    edition: 'Edition 07',
  },
  '/admin/tts': {
    id: 'tts',
    label: 'TTS Operations',
    shortLabel: 'Voice',
    kicker: 'Voice queue',
    strapline: 'Render queues, providers, and output assurance',
    edition: 'Edition 08',
  },
  '/admin/kb': {
    id: 'kb',
    label: 'KB Operations',
    shortLabel: 'KB',
    kicker: 'Research press',
    strapline: 'Sources, reliability, and ingestion controls',
    edition: 'Edition 09',
  },
};

export function getNeoPrintModuleMeta(pathname: string): NeoPrintModuleMeta {
  return MODULES[pathname] ?? DEFAULT_MODULE;
}

export function getNeoPrintThemeLabel(isDark: boolean): string {
  return isDark ? 'Mode: Nocturne' : 'Mode: Paper';
}

export function getNeoPrintIssueLabel(pathname: string): string {
  return getNeoPrintModuleMeta(pathname).edition;
}
