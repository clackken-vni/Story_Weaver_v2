import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { registerTTSRoutes } from '../routes/ttsRoutes.js';
import { TTSService } from '../services/ttsService.js';
import { BaseTTSProvider, Voice, SynthesisResult, CostEstimate } from '../providers/base.js';

class MockProvider extends BaseTTSProvider {
  async synthesize(text: string, _voice: Voice, _options?: any): Promise<SynthesisResult> {
    if (!text) {
      throw new Error('Invalid text');
    }
    return {
      audioData: Buffer.from(`Mock audio for: ${text}`),
      duration: text.length / 150,
      cost: (text.length / 1000) * 10,
    };
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: 'mock_female', name: 'Mock Female', language: 'vi-VN', gender: 'female' },
      { id: 'mock_male', name: 'Mock Male', language: 'vi-VN', gender: 'male' },
    ];
  }

  async stream(_text: string, _voice: Voice): Promise<ReadableStream> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from('mock audio'));
        controller.close();
      },
    });
  }

  estimateCost(text: string): CostEstimate {
    return {
      estimatedCost: (text.length / 1000) * 10,
      currency: 'USD',
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

describe('TTSRoutes', () => {
  let service: TTSService;
  let mockFastify: any;

  beforeEach(() => {
    service = new TTSService();
    const mockProvider = new MockProvider({});
    service.registerProvider('mock', mockProvider);

    mockFastify = {
      post: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      decorate: jest.fn(),
    };
  });

  describe('registerTTSRoutes', () => {
    it('should register all routes', async () => {
      await registerTTSRoutes(mockFastify, { service });

      expect(mockFastify.post).toHaveBeenCalledWith('/api/v1/synthesize', expect.any(Function));
      expect(mockFastify.get).toHaveBeenCalledWith('/api/v1/voices', expect.any(Function));
      expect(mockFastify.post).toHaveBeenCalledWith('/api/v1/estimate-cost', expect.any(Function));
      expect(mockFastify.get).toHaveBeenCalledWith('/api/v1/providers', expect.any(Function));
      expect(mockFastify.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });
  });
});

describe('Routes Integration', () => {
  let service: TTSService;
  let routeHandlers: Map<string, any>;

  beforeEach(() => {
    service = new TTSService();
    const mockProvider = new MockProvider({});
    service.registerProvider('mock', mockProvider);

    routeHandlers = new Map();

    const mockFastify = {
      post: (path: string, handler: any) => {
        routeHandlers.set(path, { method: 'POST', handler });
        return mockFastify;
      },
      get: (path: string, handler: any) => {
        routeHandlers.set(path, { method: 'GET', handler });
        return mockFastify;
      },
      decorate: jest.fn(),
    };

    registerTTSRoutes(mockFastify as any, { service });
  });

  describe('POST /api/v1/synthesize', () => {
    it('should synthesize speech successfully', async () => {
      const handler = routeHandlers.get('/api/v1/synthesize')?.handler;
      const mockReply = { send: jest.fn() };

      const request = {
        body: {
          text: 'Hello world',
          voice: { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' },
          provider: 'mock',
        },
      };

      await handler(request, mockReply);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should return error for missing fields', async () => {
      const handler = routeHandlers.get('/api/v1/synthesize')?.handler;
      const mockReply = { send: jest.fn() };

      const request = {
        body: {
          text: '',
        },
      };

      await handler(request, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Missing required fields: text and voice' });
    });
  });

  describe('GET /api/v1/voices', () => {
    it('should return voices', async () => {
      const handler = routeHandlers.get('/api/v1/voices')?.handler;
      const mockReply = { send: jest.fn() };

      const request = {
        query: { provider: 'mock' },
      };

      await handler(request, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({
        voices: expect.arrayContaining([
          expect.objectContaining({ id: 'mock_female' }),
        ]),
      });
    });
  });

  describe('POST /api/v1/estimate-cost', () => {
    it('should return cost estimate', async () => {
      const handler = routeHandlers.get('/api/v1/estimate-cost')?.handler;
      const mockReply = { send: jest.fn() };

      const request = {
        body: {
          text: 'Hello world',
          provider: 'mock',
        },
      };

      await handler(request, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({
        estimatedCost: expect.any(Number),
        currency: 'USD',
      });
    });

    it('should return error for missing text', async () => {
      const handler = routeHandlers.get('/api/v1/estimate-cost')?.handler;
      const mockReply = { send: jest.fn() };

      const request = {
        body: {},
      };

      await handler(request, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Missing required field: text' });
    });
  });

  describe('GET /api/v1/providers', () => {
    it('should return registered providers', async () => {
      const handler = routeHandlers.get('/api/v1/providers')?.handler;
      const mockReply = { send: jest.fn() };

      await handler({}, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({
        providers: expect.arrayContaining(['mock']),
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const handler = routeHandlers.get('/health')?.handler;

      const result = await handler();
      expect(result).toEqual({
        status: 'ok',
        service: 'tts-service',
        providers: { mock: true },
      });
    });
  });
});
