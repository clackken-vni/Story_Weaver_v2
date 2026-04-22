export interface EnvelopeMeta {
  version?: string;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: EnvelopeMeta;
}

export interface CommandCenterSummaryData {
  open_incidents: number;
  degraded_services: number;
  top_alerts: string[];
}

export interface CapabilitiesData {
  capabilities: string[];
}

export type CommandCenterSummaryResponse = Envelope<CommandCenterSummaryData>;
export type CapabilitiesResponse = Envelope<CapabilitiesData>;
