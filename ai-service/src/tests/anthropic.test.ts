import { describe, it, expect } from '@jest/globals';
import { AnthropicProvider } from '../providers/anthropic.js';

describe('AnthropicProvider', () => {
  const provider = new AnthropicProvider('test-key');

  describe('generate', () => {
    it('should generate content', async () => {
      const result = await provider.generate({ prompt: 'Hello' });
      expect(result.content).toBeDefined();
      expect(result.tokens).toBeGreaterThanOrEqual(0);
    });

    it('should include anthropic metadata', async () => {
      const result = await provider.generate({ prompt: 'Hello' });
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.provider).toBe('anthropic');
    });
  });

  describe('validateRequest', () => {
    it('should validate non-empty prompt', () => {
      expect(provider.validateRequest({ prompt: 'test' })).toBe(true);
      expect(provider.validateRequest({ prompt: '' })).toBe(false);
    });

    it('should reject empty prompt', () => {
      expect(provider.validateRequest({ prompt: '' })).toBe(false);
    });
  });
});
