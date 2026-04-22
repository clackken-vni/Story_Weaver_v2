import { describe, it, expect, beforeEach } from '@jest/globals';
import { TTSService, createTTSService, TTSConfig } from '../services/ttsService.js';
import { BaseTTSProvider, Voice, SynthesisOptions, SynthesisResult, CostEstimate, TTSError } from '../providers/base.js';
import { AudioStorage } from '../storage/minio.js';

class MockProvider extends BaseTTSProvider {
  async synthesize(text: string, _voice: Voice, _options?: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'mock');
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

describe('TTSService', () => {
  let service: TTSService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    service = new TTSService();
    mockProvider = new MockProvider({});
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      service.registerProvider('mock', mockProvider);
      expect(service.getProvider('mock')).toBe(mockProvider);
    });

    it('should set first registered provider as default', () => {
      service.registerProvider('mock', mockProvider);
      expect(service.getProvider()).toBe(mockProvider);
    });

    it('should allow multiple providers', () => {
      const provider2 = new MockProvider({});
      service.registerProvider('mock1', mockProvider);
      service.registerProvider('mock2', provider2);
      expect(service.getProvider('mock1')).toBe(mockProvider);
      expect(service.getProvider('mock2')).toBe(provider2);
    });
  });

  describe('setStorage', () => {
    it('should set storage', () => {
      const storage = new AudioStorage({ accessKey: 'test', secretKey: 'test' });
      service.setStorage(storage);
    });
  });

  describe('setDefaultProvider', () => {
    it('should change default provider', () => {
      const provider2 = new MockProvider({});
      service.registerProvider('mock1', mockProvider);
      service.registerProvider('mock2', provider2);
      service.setDefaultProvider('mock2');
      expect(service.getProvider()).toBe(provider2);
    });

    it('should not change if provider does not exist', () => {
      service.registerProvider('mock', mockProvider);
      service.setDefaultProvider('nonexistent');
      expect(service.getProvider()).toBe(mockProvider);
    });
  });

  describe('getProvider', () => {
    it('should return provider by name', () => {
      service.registerProvider('mock', mockProvider);
      expect(service.getProvider('mock')).toBe(mockProvider);
    });

    it('should return default provider when no name provided', () => {
      service.registerProvider('mock', mockProvider);
      expect(service.getProvider()).toBe(mockProvider);
    });

    it('should return undefined for unknown provider', () => {
      expect(service.getProvider('unknown')).toBeUndefined();
    });

    it('should return undefined when no providers registered and no name provided', () => {
      expect(service.getProvider()).toBeUndefined();
    });
  });

  describe('synthesize', () => {
    beforeEach(() => {
      service.registerProvider('mock', mockProvider);
    });

    it('should synthesize speech', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      const result = await service.synthesize('Hello world', voice);
      expect(result.audioData).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should throw error when provider not found', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      await expect(service.synthesize('Hello', voice, { provider: 'unknown' })).rejects.toThrow();
    });

    it('should throw TTSError with correct provider name when provider not found', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      try {
        await service.synthesize('Hello', voice, { provider: 'unknown' });
      } catch (error: any) {
        expect(error.provider).toBe('unknown');
        expect(error).toBeInstanceOf(TTSError);
      }
    });

    it('should use specified provider', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      const result = await service.synthesize('Hello', voice, { provider: 'mock' });
      expect(result.audioData).toBeInstanceOf(Buffer);
    });

    it('should include URL when storage is configured', async () => {
      const storage = new AudioStorage({ accessKey: 'test', secretKey: 'test' });
      service.setStorage(storage);
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      const result = await service.synthesize('Hello', voice);
      expect(result.url).toBeDefined();
    });
  });

  describe('getVoices', () => {
    it('should return voices from provider', async () => {
      service.registerProvider('mock', mockProvider);
      const voices = await service.getVoices();
      expect(voices).toHaveLength(2);
    });

    it('should throw error when provider not found', async () => {
      await expect(service.getVoices('unknown')).rejects.toThrow();
    });

    it('should throw TTSError with correct provider name when provider not found', async () => {
      try {
        await service.getVoices('unknown');
      } catch (error: any) {
        expect(error.provider).toBe('unknown');
        expect(error).toBeInstanceOf(TTSError);
      }
    });

    it('should use specified provider', async () => {
      service.registerProvider('mock', mockProvider);
      const voices = await service.getVoices('mock');
      expect(voices).toHaveLength(2);
    });
  });

  describe('stream', () => {
    it('should return readable stream', async () => {
      service.registerProvider('mock', mockProvider);
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      const stream = await service.stream('Hello', voice);
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should throw error when provider not found', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      await expect(service.stream('Hello', voice, 'unknown')).rejects.toThrow();
    });

    it('should throw TTSError with correct provider name when provider not found', async () => {
      const voice: Voice = { id: 'mock_female', name: 'Mock Female', language: 'vi-VN' };
      try {
        await service.stream('Hello', voice, 'unknown');
      } catch (error: any) {
        expect(error.provider).toBe('unknown');
        expect(error).toBeInstanceOf(TTSError);
      }
    });
  });

  describe('estimateCost', () => {
    it('should return cost estimate', () => {
      service.registerProvider('mock', mockProvider);
      const cost = service.estimateCost('Hello');
      expect(cost.estimatedCost).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
    });

    it('should throw error when provider not found', () => {
      expect(() => service.estimateCost('Hello', 'unknown')).toThrow();
    });

    it('should throw TTSError with correct provider name when provider not found', () => {
      try {
        service.estimateCost('Hello', 'unknown');
      } catch (error: any) {
        expect(error.provider).toBe('unknown');
        expect(error).toBeInstanceOf(TTSError);
      }
    });
  });

  describe('healthCheck', () => {
    it('should return health status for all providers', async () => {
      service.registerProvider('mock', mockProvider);
      const health = await service.healthCheck();
      expect(health.mock).toBe(true);
    });
  });

  describe('getRegisteredProviders', () => {
    it('should return list of registered provider names', () => {
      service.registerProvider('mock1', mockProvider);
      const provider2 = new MockProvider({});
      service.registerProvider('mock2', provider2);
      const providers = service.getRegisteredProviders();
      expect(providers).toContain('mock1');
      expect(providers).toContain('mock2');
    });

    it('should return empty array when no providers registered', () => {
      const providers = service.getRegisteredProviders();
      expect(providers).toEqual([]);
    });
  });
});

describe('createTTSService', () => {
  it('should create service with vbee provider', () => {
    const service = createTTSService({
      vbee: { apiKey: 'test-key' },
    });
    expect(service.getProvider('vbee')).toBeDefined();
  });

  it('should create service with google provider', () => {
    const service = createTTSService({
      google: { projectId: 'test-project' },
    });
    expect(service.getProvider('google')).toBeDefined();
  });

  it('should create service with elevenlabs provider', () => {
    const service = createTTSService({
      elevenlabs: { apiKey: 'test-key' },
    });
    expect(service.getProvider('elevenlabs')).toBeDefined();
  });

  it('should create service with storage', () => {
    const service = createTTSService({
      vbee: { apiKey: 'test-key' },
      storage: {
        endPoint: 'localhost',
        accessKey: 'test-key',
        secretKey: 'test-secret',
      },
    });
    expect(service.getProvider('vbee')).toBeDefined();
  });

  it('should set default provider', () => {
    const service = createTTSService({
      vbee: { apiKey: 'test-key' },
      google: { projectId: 'test-project' },
      defaultProvider: 'google',
    });
    expect(service.getProvider()).toBeDefined();
  });
});
