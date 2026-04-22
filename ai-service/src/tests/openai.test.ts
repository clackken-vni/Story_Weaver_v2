import { describe, it, expect } from '@jest/globals';
import { GeminiProvider, OpenAIProvider, createProvider } from '../providers/openai.js';

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider('test-key');

  describe('generate', () => {
    it('should generate content', async () => {
      const result = await provider.generate({ prompt: 'Hello' });
      expect(result.content).toBeDefined();
      expect(result.tokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateRequest', () => {
    it('should validate non-empty prompt', () => {
      expect(provider.validateRequest({ prompt: 'test' })).toBe(true);
      expect(provider.validateRequest({ prompt: '' })).toBe(false);
    });
  });
});

describe('GeminiProvider', () => {
  const provider = new GeminiProvider('test-key');

  describe('generate', () => {
    it('should generate content', async () => {
      const result = await provider.generate({ prompt: 'Hello' });
      expect(result.content).toBeDefined();
    });
  });

  describe('validateRequest', () => {
    it('should validate non-empty prompt', () => {
      expect(provider.validateRequest({ prompt: 'test' })).toBe(true);
      expect(provider.validateRequest({ prompt: '' })).toBe(false);
    });
  });
});

describe('createProvider', () => {
  it('should create openai provider', () => {
    const provider = createProvider('openai', 'key');
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create gemini provider', () => {
    const provider = createProvider('gemini', 'key');
    expect(provider).toBeInstanceOf(GeminiProvider);
  });
});