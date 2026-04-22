import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { wizardRoutes } from '../routes/wizard.js';

const mockRepository = {
  initSchema: jest.fn<() => Promise<void>>(),
  createProject: jest.fn<() => Promise<any>>(),
  getProject: jest.fn<() => Promise<any>>(),
  getProjectsByUser: jest.fn<() => Promise<any[]>>(),
  updateProject: jest.fn<() => Promise<any>>(),
  deleteProject: jest.fn<() => Promise<void>>(),
};

describe('Wizard Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(wizardRoutes, { repository: mockRepository as any });
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        status: 'ok',
        service: 'wizard-service',
      });
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const mockProject = {
        id: 'proj-1',
        userId: 'user-123',
        title: 'My Story',
        currentStep: 'choose_genre',
        stepData: {},
      };
      mockRepository.createProject.mockResolvedValue(mockProject);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: {
          userId: 'user-123',
          title: 'My Story',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = JSON.parse(response.payload);
      expect(payload.title).toBe('My Story');
    });

    it('should return 400 for missing userId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: {
          title: 'My Story',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: {
          userId: 'user-123',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should return a project', async () => {
      const mockProject = {
        id: 'proj-1',
        userId: 'user-123',
        title: 'My Story',
        currentStep: 'choose_genre',
        stepData: {},
      };
      mockRepository.getProject.mockResolvedValue(mockProject);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/proj-1',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.id).toBe('proj-1');
    });

    it('should return 404 for nonexistent project', async () => {
      mockRepository.getProject.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return user projects', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          userId: 'user-123',
          title: 'Story 1',
          currentStep: 'choose_genre',
          stepData: {},
        },
      ];
      mockRepository.getProjectsByUser.mockResolvedValue(mockProjects);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects?userId=user-123',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.projects).toHaveLength(1);
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    it('should update a project', async () => {
      const mockProject = {
        id: 'proj-1',
        userId: 'user-123',
        title: 'Updated Title',
        currentStep: 'define_characters',
        stepData: {},
      };
      mockRepository.updateProject.mockResolvedValue(mockProject);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/projects/proj-1',
        payload: {
          title: 'Updated Title',
          currentStep: 'define_characters',
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.title).toBe('Updated Title');
    });

    it('should return 404 for nonexistent project', async () => {
      mockRepository.updateProject.mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/projects/nonexistent',
        payload: { title: 'Test' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project', async () => {
      mockRepository.deleteProject.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/projects/proj-1',
      });

      expect(response.statusCode).toBe(204);
    });
  });
});
