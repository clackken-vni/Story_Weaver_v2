import type { CommandCenterSummaryResponse, CapabilitiesResponse, Envelope } from './contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'http://localhost:8080';
const API_ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_API_ENCRYPTION_KEY ||
  'changeme_32bytes_padded_key_here';

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
}

export interface UsageStats {
  total_projects: number;
  total_generations: number;
  active_projects: number;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface MetricsResponse {
  cpu: number;
  memory: number;
  uptime: number;
}

export class AdminApiClient {
  private accessToken: string | null = null;
  private authExpiredHandler: ((message?: string) => void) | null = null;

  setAuthExpiredHandler(handler: ((message?: string) => void) | null): void {
    this.authExpiredHandler = handler;
  }

  private notifyAuthExpired(message?: string): void {
    if (this.authExpiredHandler) {
      this.authExpiredHandler(message);
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private toBase64(data: Uint8Array): string {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      let binary = '';
      data.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return window.btoa(binary);
    }

    return Buffer.from(data).toString('base64');
  }

  private async encryptPayload(payload: unknown): Promise<{ encrypted: string; iv: string }> {
    const keyBytes = new TextEncoder().encode(API_ENCRYPTION_KEY);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);

    return {
      encrypted: this.toBase64(new Uint8Array(ciphertext)),
      iv: this.toBase64(iv),
    };
  }

  private shouldEncrypt(endpoint: string, options: RequestInit): boolean {
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'POST') {
      return false;
    }

    return (
      endpoint.startsWith('/api/v1/auth/') ||
      endpoint.startsWith('/api/v1/admin/') ||
      endpoint.startsWith('/api/v1/wizard/') ||
      endpoint.startsWith('/api/v1/ai/') ||
      endpoint.startsWith('/api/v1/tts/') ||
      endpoint.startsWith('/api/v1/kb/')
    );
  }

  private async requestInternal<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    if (this.shouldEncrypt(endpoint, requestOptions)) {
      const body = requestOptions.body;
      const parsedBody = typeof body === 'string' && body.trim().length > 0 ? JSON.parse(body) : {};
      const encryptedBody = await this.encryptPayload(parsedBody);
      requestOptions.body = JSON.stringify(encryptedBody);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      if (response.status === 401 && this.accessToken) {
        this.accessToken = null;
        this.notifyAuthExpired(error.error || 'Session expired');
      }
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const result = await this.requestInternal<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAccessToken(result.access_token);
    return result;
  }

  async getUserStats(): Promise<UserStats> {
    return this.requestInternal<UserStats>('/api/v1/admin/stats/users');
  }

  async getUsageStats(): Promise<UsageStats> {
    return this.requestInternal<UsageStats>('/api/v1/admin/stats/usage');
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<UsersResponse> {
    return this.requestInternal<UsersResponse>(`/api/v1/admin/users?page=${page}&limit=${limit}`);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.requestInternal<void>(`/api/v1/admin/users/${userId}`, { method: 'DELETE' });
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.requestInternal<MetricsResponse>('/api/v1/admin/metrics');
  }

  async getCapabilities(): Promise<CapabilitiesResponse> {
    return this.requestInternal<CapabilitiesResponse>('/api/v1/admin/capabilities');
  }

  async getCommandCenterSummary(): Promise<CommandCenterSummaryResponse> {
    return this.requestInternal<CommandCenterSummaryResponse>('/api/v1/admin/command-center/summary');
  }

  async getMonitoringServices(): Promise<Envelope<unknown>> {
    return this.requestInternal<Envelope<unknown>>('/api/v1/admin/monitoring/services');
  }

  async getMonitoringInfra(): Promise<Envelope<unknown>> {
    return this.requestInternal<Envelope<unknown>>('/api/v1/admin/monitoring/infra');
  }

  async getIncidents(): Promise<Envelope<unknown>> {
    return this.requestInternal<Envelope<unknown>>('/api/v1/admin/incidents');
  }

  async ackIncident(id: string): Promise<void> {
    await this.requestInternal<void>(`/api/v1/admin/incidents/${id}/ack`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getAuditEvents(params?: { traceId?: string; from?: string; to?: string }): Promise<Envelope<unknown>> {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.requestInternal<Envelope<unknown>>(`/api/v1/admin/audit/events${qs ? `?${qs}` : ''}`);
  }

  async getAuditTrace(traceId: string): Promise<Envelope<unknown>> {
    return this.requestInternal<Envelope<unknown>>(`/api/v1/admin/audit/traces/${traceId}`);
  }

  async getUserDetail(userId: string): Promise<Envelope<unknown>> {
    return this.requestInternal<Envelope<unknown>>(`/api/v1/admin/users/${userId}`);
  }

  async lockUser(userId: string, reason: string): Promise<void> {
    await this.requestInternal<void>(`/api/v1/admin/users/${userId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unlockUser(userId: string, reason: string): Promise<void> {
    await this.requestInternal<void>(`/api/v1/admin/users/${userId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateUserRole(userId: string, role: string, reason: string): Promise<void> {
    await this.requestInternal<void>(`/api/v1/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role, reason }),
    });
  }

  /** Expose generic request for settings module */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.requestInternal<T>(endpoint, options);
  }
}

export const adminApi = new AdminApiClient();
