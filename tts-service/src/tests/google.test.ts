import { describe, it, expect, beforeEach } from '@jest/globals';
import { GoogleTTSProvider } from '../providers/google.js';

describe('GoogleTTSProvider', () => {
  let provider: GoogleTTSProvider;

  beforeEach(() => {
    provider = new GoogleTTSProvider({
      credentials: { test: 'credentials' },
      projectId: 'test-project',
    });
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      expect(provider).toBeInstanceOf(GoogleTTSProvider);
    });

    it('should create provider without config', () => {
      const defaultProvider = new GoogleTTSProvider({});
      expect(defaultProvider).toBeInstanceOf(GoogleTTSProvider);
    });
  });

  describe('validateText', () => {
    it('should return false for empty text', () => {
      expect(provider.validateText('')).toBe(false);
    });

    it('should return true for valid text', () => {
      expect(provider.validateText('Hello world')).toBe(true);
    });

    it('should return false for text exceeding 5000 characters', () => {
      const longText = 'x'.repeat(5001);
      expect(provider.validateText(longText)).toBe(false);
    });
  });

  describe('synthesize', () => {
    it('should throw error for empty text', async () => {
      await expect(
        provider.synthesize('', { id: 'vi-VN-Standard-A', name: 'Vietnamese A', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should throw error with correct provider name', async () => {
      try {
        await provider.synthesize('', { id: 'vi-VN-Standard-A', name: 'Vietnamese A', language: 'vi-VN' });
      } catch (error: any) {
        expect(error.provider).toBe('google');
      }
    });

    it('should synthesize speech successfully', async () => {
      const voice = { id: 'vi-VN-Standard-A', name: 'Vietnamese Standard A', language: 'vi-VN' };
      const result = await provider.synthesize('Hello', voice);

      expect(result.audioData).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThanOrEqual(0);
    });

    it('should include audio data in result', async () => {
      const voice = { id: 'vi-VN-Standard-A', name: 'Vietnamese Standard A', language: 'vi-VN' };
      const result = await provider.synthesize('Hello world', voice);

      expect(result.audioData.length).toBeGreaterThan(0);
    });
  });

  describe('getVoices', () => {
    it('should return list of Vietnamese voices', async () => {
      const voices = await provider.getVoices();
      expect(voices).toHaveLength(3);
      expect(voices[0]).toHaveProperty('id');
      expect(voices[0]).toHaveProperty('name');
      expect(voices[0]).toHaveProperty('language');
      expect(voices[0]).toHaveProperty('gender');
    });
  });

  describe('stream', () => {
    it('should throw error for empty text', async () => {
      await expect(
        provider.stream('', { id: 'vi-VN-Standard-A', name: 'Vietnamese A', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should return readable stream', async () => {
      const voice = { id: 'vi-VN-Standard-A', name: 'Vietnamese Standard A', language: 'vi-VN' };
      const stream = await provider.stream('Hello', voice);
      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost in USD', () => {
      const cost = provider.estimateCost('Hello world');
      expect(cost.currency).toBe('USD');
      expect(cost.estimatedCost).toBeGreaterThan(0);
    });

    it('should calculate based on character count with USD rate', () => {
      const text = 'Hello';
      const cost = provider.estimateCost(text);
      const expectedCost = (text.length / 1000) * 0.016;
      expect(cost.estimatedCost).toBe(expectedCost);
    });
  });

  describe('estimateDuration', () => {
    it('should estimate duration based on text length', () => {
      const text = 'Hello world';
      const expectedDuration = text.length / 150;
      expect(provider.estimateDuration(text)).toBe(expectedDuration);
    });
  });

  describe('healthCheck', () => {
    it('should return true when voices are available', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });
  });
});
