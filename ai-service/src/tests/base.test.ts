import { describe, it, expect } from '@jest/globals';
import { AIProviderError } from '../providers/base.js';

describe('AIProviderError', () => {
  it('should create error with message and provider', () => {
    const error = new AIProviderError('Test error', 'openai');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AIProviderError');
    expect(error.provider).toBe('openai');
  });

  it('should include provider name', () => {
    const error = new AIProviderError('Provider failed', 'openai');
    expect(error.provider).toBe('openai');
  });

  it('should include status code', () => {
    const error = new AIProviderError('Rate limited', 'openai', 429);
    expect(error.statusCode).toBe(429);
  });
});