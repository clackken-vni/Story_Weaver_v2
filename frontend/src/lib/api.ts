import type {
  Project,
  User,
  AuthResponse,
  ApiResponse,
  WizardStep,
  StepData,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

export class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  clearRefreshToken(): void {
    this.refreshToken = null;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData: ErrorResponse = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  private async requestWithRefresh<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('401') &&
        this.refreshToken
      ) {
        // Try to refresh the token
        const refreshed = await this.refreshAccessToken(this.refreshToken);
        if (refreshed) {
          // Retry the original request
          return this.request<T>(endpoint, options);
        }
      }
      throw error;
    }
  }

  private async refreshAccessToken(token: string): Promise<boolean> {
    try {
      const result = await this.request<{ access_token: string }>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refresh_token: token },
      });
      this.setAccessToken(result.access_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth endpoints
  async register(email: string, password: string): Promise<User> {
    const response = await this.request<{ user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    return response.user;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setAccessToken(result.access_token);
    this.setRefreshToken(result.refresh_token);
    return result;
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  // Project endpoints
  async getProjects(): Promise<Project[]> {
    const response = await this.requestWithRefresh<{ projects: Project[] }>('/api/v1/wizard/projects');
    return response.projects;
  }

  async getProject(id: string): Promise<Project> {
    return this.requestWithRefresh<Project>(`/api/v1/wizard/projects/${id}`);
  }

  async createProject(title: string): Promise<Project> {
    return this.requestWithRefresh<Project>('/api/v1/wizard/projects', {
      method: 'POST',
      body: { title },
    });
  }

  async updateProjectStep(id: string, step: string, data: unknown): Promise<Project> {
    return this.requestWithRefresh<Project>(`/api/v1/wizard/projects/${id}/step/${step}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/api/v1/wizard/projects/${id}`, { method: 'DELETE' });
  }

  // Story writing endpoints
  async saveChapter(projectId: string, chapterNumber: number, content: string): Promise<Chapter> {
    return this.requestWithRefresh<Chapter>(`/api/v1/wizard/projects/${projectId}/chapters/${chapterNumber}`, {
      method: 'PUT',
      body: { content },
    });
  }

  async getChapter(projectId: string, chapterNumber: number): Promise<Chapter | null> {
    try {
      return await this.requestWithRefresh<Chapter>(
        `/api/v1/wizard/projects/${projectId}/chapters/${chapterNumber}`
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

export const api = new ApiClient();