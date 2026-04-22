import { describe, it, expect, beforeEach } from '@jest/globals';
import { AIService } from '../services/aiService.js';
import { GenerationRequest, GenerationResult, AIProvider } from '../providers/base.js';

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

class InvalidMockProvider implements AIProvider {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      content: '',
      tokens: 0,
      finishReason: 'stop'
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return false;
  }
}

describe('AIService', () => {
  let service: AIService;
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
    service = new AIService();
    service.registerProvider('mock', provider);
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const newService = new AIService();
      newService.registerProvider('test', provider);
      expect(newService.providers['test']).toBeDefined();
    });

    it('should set first provider as default', () => {
      const newService = new AIService();
      newService.registerProvider('first', provider);
      expect(newService.getProvider()).toBe(provider);
    });
  });

  describe('setDefaultProvider', () => {
    it('should change default provider', () => {
      const mock1 = new MockProvider();
      const mock2 = new MockProvider();
      const newService = new AIService();
      newService.registerProvider('first', mock1);
      newService.registerProvider('second', mock2);
      newService.setDefaultProvider('second');
      expect(newService.getProvider()).toBe(mock2);
    });
  });

  describe('getProvider', () => {
    it('should return specific provider by name', () => {
      const result = service.getProvider('mock');
      expect(result).toBe(provider);
    });

    it('should return default provider when no name specified', () => {
      const result = service.getProvider();
      expect(result).toBe(provider);
    });

    it('should return undefined for unknown provider', () => {
      const result = service.getProvider('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('generate', () => {
    it('should generate content', async () => {
      const result = await service.generate({ prompt: 'Write a story' });

      expect(result.content).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should generate with specific provider', async () => {
      const result = await service.generate({ prompt: 'Write a story' }, { provider: 'mock' });
      expect(result.content).toBeDefined();
    });

    it('should throw error when provider not found', async () => {
      await expect(
        service.generate({ prompt: 'Write a story' }, { provider: 'nonexistent' })
      ).rejects.toThrow('Provider nonexistent not found');
    });

    it('should validate request', () => {
      expect(service.validateRequest({ prompt: '' })).toBe(false);
      expect(service.validateRequest({ prompt: 'valid' })).toBe(true);
    });

    it('should reject oversized prompts', () => {
      const longPrompt = 'x'.repeat(5001);
      expect(service.validateRequest({ prompt: longPrompt })).toBe(false);
    });

    it('should throw error when provider rejects request', async () => {
      const invalidService = new AIService();
      invalidService.registerProvider('invalid', new InvalidMockProvider());

      await expect(
        invalidService.generate({ prompt: 'Any prompt' })
      ).rejects.toThrow('Invalid request');
    });
  });

  describe('GenerationRequest', () => {
    it('should create valid request', () => {
      const request: GenerationRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: 0.7
      };

      expect(request.prompt).toBe('Test prompt');
      expect(request.maxTokens).toBe(1000);
    });
  });

  describe('GenerationResult', () => {
    it('should have required fields', () => {
      const result: GenerationResult = {
        content: 'Generated content',
        tokens: 50,
        finishReason: 'stop'
      };

      expect(result.content).toBe('Generated content');
      expect(result.tokens).toBe(50);
    });
  });
});