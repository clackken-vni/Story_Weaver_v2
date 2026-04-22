import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VbeeProvider } from '../providers/vbee.js';

global.fetch = jest.fn();

describe('VbeeProvider', () => {
  let provider: VbeeProvider;

  beforeEach(() => {
    provider = new VbeeProvider({ apiKey: 'test-api-key' });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with default apiUrl', () => {
      expect(provider).toBeInstanceOf(VbeeProvider);
    });

    it('should create provider with custom apiUrl', () => {
      const customProvider = new VbeeProvider({
        apiKey: 'test-key',
        apiUrl: 'https://custom.vbee.vn/v1/synthesize',
      });
      expect(customProvider).toBeInstanceOf(VbeeProvider);
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
        provider.synthesize('', { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should throw error with correct provider name', async () => {
      try {
        await provider.synthesize('', { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' });
      } catch (error: any) {
        expect(error.provider).toBe('vbee');
      }
    });

    it('should synthesize speech successfully', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData),
      });

      const voice = { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' };
      const result = await provider.synthesize('Hello', voice);

      expect(result.audioData).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThanOrEqual(0);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const voice = { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' };
      await expect(provider.synthesize('Hello', voice)).rejects.toThrow('Vbee API error: 401');
    });
  });

  describe('getVoices', () => {
    it('should return list of Vietnamese voices', async () => {
      const voices = await provider.getVoices();
      expect(voices).toHaveLength(3);
      expect(voices[0]).toEqual({
        id: 'vbee_female',
        name: 'Vbee Female (Vietnamese)',
        language: 'vi-VN',
        gender: 'female',
      });
    });
  });

  describe('stream', () => {
    it('should throw error for empty text', async () => {
      await expect(
        provider.stream('', { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should return readable stream', async () => {
      const mockStream = new ReadableStream();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const voice = { id: 'vbee_female', name: 'Vbee Female', language: 'vi-VN' };
      const stream = await provider.stream('Hello', voice);
      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost in VND', () => {
      const cost = provider.estimateCost('Hello world');
      expect(cost.currency).toBe('VND');
      expect(cost.estimatedCost).toBeGreaterThan(0);
    });

    it('should calculate based on character count', () => {
      const text = 'Hello';
      const cost = provider.estimateCost(text);
      const expectedCost = (text.length / 1000) * 100;
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
