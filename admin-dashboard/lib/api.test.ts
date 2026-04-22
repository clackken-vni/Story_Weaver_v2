import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// We need to mock the fetch before importing the module
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocking
import { AdminApiClient } from './api';

describe('AdminApiClient', () => {
  let testApi: AdminApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    testApi = new AdminApiClient();
  });

  describe('login', () => {
    it('should login successfully and set access token', async () => {
      const mockResponse = { access_token: 'test-token-123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await testApi.login('admin@example.com', 'password123');

      expect(result).toEqual(mockResponse);
      expect(testApi.getAccessToken()).toBe('test-token-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8085/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
        })
      );
    });

    it('should throw error on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(testApi.login('admin@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserStats', () => {
    it('should fetch user stats', async () => {
      const mockStats = {
        total_users: 100,
        active_users: 50,
        new_users_today: 5,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const stats = await testApi.getUserStats();

      expect(stats).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8085/api/v1/admin/stats/users',
        expect.any(Object)
      );
    });
  });

  describe('getUsageStats', () => {
    it('should fetch usage stats', async () => {
      const mockStats = {
        total_projects: 200,
        total_generations: 1500,
        active_projects: 75,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const stats = await testApi.getUsageStats();

      expect(stats).toEqual(mockStats);
    });
  });

  describe('getUsers', () => {
    it('should fetch users with pagination', async () => {
      const mockResponse = {
        users: [{ id: '1', email: 'user@example.com', role: 'member' }],
        total: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await testApi.getUsers(1, 10);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8085/api/v1/admin/users?page=1&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(testApi.deleteUser('user-123')).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8085/api/v1/admin/users/user-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getMetrics', () => {
    it('should fetch system metrics', async () => {
      const mockMetrics = { cpu: 45.5, memory: 62.3, uptime: 86400 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetrics),
      });

      const metrics = await testApi.getMetrics();

      expect(metrics).toEqual(mockMetrics);
    });
  });

  describe('authentication', () => {
    it('should include authorization header when token is set', async () => {
      testApi.setAccessToken('test-token');
      const mockStats = { total_users: 10, active_users: 5, new_users_today: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      await testApi.getUserStats();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8085/api/v1/admin/stats/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error with message when response is not ok and json returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      });

      await expect(testApi.getUserStats()).rejects.toThrow('Bad request');
    });

    it('should throw error with status when response is not ok and json fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('JSON parse error')),
      });

      await expect(testApi.getUserStats()).rejects.toThrow('Unknown error');
    });

    it('should throw generic error when response is not ok and no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({}),
      });

      await expect(testApi.getUserStats()).rejects.toThrow('Request failed with status 403');
    });
  });
});
