import { ApiClient } from '@/lib/api';

const mockFetch = jest.fn();

global.fetch = mockFetch;

describe('ApiClient', () => {
  let api: ApiClient;

  beforeEach(() => {
    api = new ApiClient();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('initializes with null access token', () => {
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('setAccessToken', () => {
    it('sets the access token', () => {
      api.setAccessToken('test-token');
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('clearAccessToken', () => {
    it('clears the access token', () => {
      api.setAccessToken('test-token');
      api.clearAccessToken();
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('setRefreshToken', () => {
    it('sets the refresh token', () => {
      api.setRefreshToken('refresh-token');
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('clearRefreshToken', () => {
    it('clears the refresh token', () => {
      api.setRefreshToken('refresh-token');
      api.clearRefreshToken();
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('clearTokens', () => {
    it('clears both tokens', () => {
      api.setAccessToken('access');
      api.setRefreshToken('refresh');
      api.clearTokens();
      expect(api).toBeInstanceOf(ApiClient);
    });
  });

  describe('login', () => {
    it('calls the correct endpoint with credentials', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as unknown as Response);

      const result = await api.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
        text: () => Promise.resolve(JSON.stringify({ error: 'Invalid credentials' })),
      } as unknown as Response);

      await expect(api.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('calls the correct endpoint with credentials', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
        text: () => Promise.resolve(JSON.stringify({ user: mockUser })),
      } as unknown as Response);

      const result = await api.register('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('getProjects', () => {
    it('returns list of projects', async () => {
      const mockProjects = [
        { id: '1', title: 'Project 1', userId: 'user1', currentStep: 'settings', stepData: {}, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Project 2', userId: 'user1', currentStep: 'characters', stepData: {}, createdAt: '', updatedAt: '' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ projects: mockProjects }),
        text: () => Promise.resolve(JSON.stringify({ projects: mockProjects })),
      } as unknown as Response);

      const result = await api.getProjects();

      expect(result).toEqual(mockProjects);
    });

    it('handles empty projects list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ projects: [] }),
        text: () => Promise.resolve(JSON.stringify({ projects: [] })),
      } as unknown as Response);

      const result = await api.getProjects();

      expect(result).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('creates a new project with title', async () => {
      const mockProject = {
        id: '1',
        title: 'My Story',
        userId: 'user1',
        currentStep: 'settings',
        stepData: {},
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProject),
        text: () => Promise.resolve(JSON.stringify(mockProject)),
      } as unknown as Response);

      const result = await api.createProject('My Story');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wizard/projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'My Story' }),
        })
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProject', () => {
    it('fetches a single project by id', async () => {
      const mockProject = {
        id: '123',
        title: 'My Story',
        userId: 'user1',
        currentStep: 'characters',
        stepData: { characters: {} },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProject),
        text: () => Promise.resolve(JSON.stringify(mockProject)),
      } as unknown as Response);

      const result = await api.getProject('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wizard/projects/123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('updateProjectStep', () => {
    it('updates project step data', async () => {
      const mockProject = {
        id: '123',
        title: 'My Story',
        userId: 'user1',
        currentStep: 'characters',
        stepData: { settings: { genre: 'fantasy' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProject),
        text: () => Promise.resolve(JSON.stringify(mockProject)),
      } as unknown as Response);

      const result = await api.updateProjectStep('123', 'settings', { genre: 'fantasy' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wizard/projects/123/step/settings'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ genre: 'fantasy' }),
        })
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('deleteProject', () => {
    it('deletes a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
      } as unknown as Response);

      await expect(api.deleteProject('123')).resolves.toBeUndefined();
    });
  });

  describe('logout', () => {
    it('calls logout endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
      } as unknown as Response);

      await expect(api.logout()).resolves.toBeUndefined();
    });
  });

  describe('saveChapter', () => {
    it('saves chapter content', async () => {
      const mockChapter = {
        id: 'ch1',
        number: 1,
        title: 'Chapter 1',
        content: 'Content here',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockChapter),
        text: () => Promise.resolve(JSON.stringify(mockChapter)),
      } as unknown as Response);

      const result = await api.saveChapter('123', 1, 'Content here');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wizard/projects/123/chapters/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content: 'Content here' }),
        })
      );
      expect(result).toEqual(mockChapter);
    });
  });

  describe('getChapter', () => {
    it('fetches a chapter', async () => {
      const mockChapter = {
        id: 'ch1',
        number: 1,
        title: 'Chapter 1',
        content: 'Content here',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockChapter),
        text: () => Promise.resolve(JSON.stringify(mockChapter)),
      } as unknown as Response);

      const result = await api.getChapter('123', 1);

      expect(result).toEqual(mockChapter);
    });

    it('returns null on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      } as unknown as Response);

      const result = await api.getChapter('123', 999);

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('parses error response correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
        text: () => Promise.resolve(JSON.stringify({ error: 'Server error' })),
      } as unknown as Response);

      await expect(api.getProjects()).rejects.toThrow('Server error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getProjects()).rejects.toThrow('Network error');
    });

    it('handles invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('not valid json'),
      } as unknown as Response);

      await expect(api.getProjects()).rejects.toThrow();
    });

    it('handles empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
      } as unknown as Response);

      const result = await api.deleteProject('123');
      expect(result).toBeUndefined();
    });

    it('parses error with message field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
      } as unknown as Response);

      await expect(api.getProjects()).rejects.toThrow('Bad request');
    });

    it('uses default error message when no JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('json parse error')),
        text: () => Promise.resolve(''),
      } as unknown as Response);

      await expect(api.getProjects()).rejects.toThrow('Request failed with status 500');
    });
  });
});