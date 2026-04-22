import { describe, it, expect } from '@jest/globals';
import { AIProviderError, createAIProvider, StoryGeneration } from '../providers/aiProvider.js';

describe('AIProvider', () => {
  describe('createAIProvider', () => {
    it('should create mock provider', () => {
      const provider = createAIProvider('mock');
      expect(provider).toBeDefined();
    });

    it('should create default provider', () => {
      const provider = createAIProvider('openai');
      expect(provider).toBeDefined();
    });
  });

  describe('MockAIProvider', () => {
    const provider = createAIProvider('mock');

    it('should generate story', async () => {
      const result = await provider.generateStory('Write a fantasy story');

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should validate prompt', () => {
      expect(provider.validatePrompt('valid prompt')).toBe(true);
      expect(provider.validatePrompt('')).toBe(false);
      expect(provider.validatePrompt('x'.repeat(10001))).toBe(false);
    });
  });

  describe('AIProviderError', () => {
    it('should create error with provider info', () => {
      const error = new AIProviderError('Test error', 'mock', 500);

      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('mock');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AIProviderError');
    });
  });

  describe('StoryGeneration', () => {
    it('should have required fields', async () => {
      const provider = createAIProvider('mock');
      const result = await provider.generateStory('Test prompt');

      const story: StoryGeneration = {
        content: result.content,
        title: result.title,
        metadata: result.metadata
      };

      expect(story.content).toBeDefined();
    });
  });
});