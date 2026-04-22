import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { AIService } from '../services/aiService.js';
import { GenerationRequest, GenerationResult, AIProvider } from '../providers/base.js';
import { registerAIRoutes } from '../routes/aiRoutes.js';

class MockProvider implements AIProvider {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      content: `Generated: ${request.prompt.substring(0, 30)}...`,
      tokens: 100,
      finishReason: 'stop'
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return request.prompt.length > 0 && request.prompt.length <= 5000;
  }
}

class ErrorProvider implements AIProvider {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    throw new Error('Provider error');
  }

  validateRequest(request: GenerationRequest): boolean {
    return true;
  }
}

class JsonProvider implements AIProvider {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      content: '{"key": "value"}',
      tokens: 10,
      finishReason: 'stop'
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return true;
  }
}

class MarkdownJsonProvider implements AIProvider {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      content: '```json\n{"key": "value"}\n```',
      tokens: 10,
      finishReason: 'stop'
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return true;
  }
}

describe('AI Routes', () => {
  let app: FastifyInstance;
  let aiService: AIService;
  let provider: MockProvider;

  beforeEach(async () => {
    provider = new MockProvider();
    aiService = new AIService();
    aiService.registerProvider('mock', provider);

    app = Fastify();
    await registerAIRoutes(app, aiService);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/generate', () => {
    it('should generate content with valid prompt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate',
        payload: {
          prompt: 'Write a story'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.content).toBeDefined();
      expect(body.tokens).toBeDefined();
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('prompt is required');
    });

    it('should return 400 when prompt is not a string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate',
        payload: {
          prompt: 123
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 when provider throws error', async () => {
      const errorService = new AIService();
      errorService.registerProvider('error', new ErrorProvider());

      const errorApp = Fastify();
      await registerAIRoutes(errorApp, errorService);
      await errorApp.ready();

      const response = await errorApp.inject({
        method: 'POST',
        url: '/api/v1/generate',
        payload: {
          prompt: 'Write a story'
        }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();

      await errorApp.close();
    });
  });

  describe('POST /api/v1/generate/json', () => {
    it('should return JSON data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {
          prompt: 'Return JSON'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return JSON with schema', async () => {
      const jsonService = new AIService();
      jsonService.registerProvider('json', new JsonProvider());

      const jsonApp = Fastify();
      await registerAIRoutes(jsonApp, jsonService);
      await jsonApp.ready();

      const response = await jsonApp.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {
          prompt: 'Return JSON',
          schema: { type: 'object' }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.schema).toBeDefined();

      await jsonApp.close();
    });

    it('should return 500 when content is not valid JSON with schema', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {
          prompt: 'Return JSON',
          schema: { type: 'object' }
        }
      });

      expect(response.statusCode).toBe(500);
    });

    it('should extract JSON from markdown code blocks', async () => {
      const markdownService = new AIService();
      markdownService.registerProvider('markdown', new MarkdownJsonProvider());

      const markdownApp = Fastify();
      await registerAIRoutes(markdownApp, markdownService);
      await markdownApp.ready();

      const response = await markdownApp.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {
          prompt: 'Return JSON'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.data.key).toBe('value');

      await markdownApp.close();
    });

    it('should return 500 when provider throws in generate/json', async () => {
      const errorService = new AIService();
      errorService.registerProvider('error', new ErrorProvider());

      const errorApp = Fastify();
      await registerAIRoutes(errorApp, errorService);
      await errorApp.ready();

      const response = await errorApp.inject({
        method: 'POST',
        url: '/api/v1/generate/json',
        payload: {
          prompt: 'Return JSON'
        }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();

      await errorApp.close();
    });
  });

  describe('GET /api/v1/models', () => {
    it('should return all models when no provider specified', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/models'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.models).toBeDefined();
      expect(body.models.openai).toBeDefined();
      expect(body.models.gemini).toBeDefined();
      expect(body.models.anthropic).toBeDefined();
    });

    it('should return models for specific provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/models?provider=openai'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.models).toBeDefined();
      expect(body.models.length).toBeGreaterThan(0);
    });

    it('should return 400 for unknown provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/models?provider=unknown'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Unknown provider');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.service).toBe('ai-service');
    });
  });
});
