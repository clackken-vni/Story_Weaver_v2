import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ElevenLabsProvider } from '../providers/elevenlabs.js';

global.fetch = jest.fn();

describe('ElevenLabsProvider', () => {
  let provider: ElevenLabsProvider;

  beforeEach(() => {
    provider = new ElevenLabsProvider({ apiKey: 'test-api-key' });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with default baseUrl', () => {
      expect(provider).toBeInstanceOf(ElevenLabsProvider);
    });

    it('should create provider with custom baseUrl', () => {
      const customProvider = new ElevenLabsProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.elevenlabs.io/v1',
      });
      expect(customProvider).toBeInstanceOf(ElevenLabsProvider);
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
        provider.synthesize('', { id: 'voice123', name: 'Test Voice', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should throw error with correct provider name', async () => {
      try {
        await provider.synthesize('', { id: 'voice123', name: 'Test Voice', language: 'vi-VN' });
      } catch (error: any) {
        expect(error.provider).toBe('elevenlabs');
      }
    });

    it('should synthesize speech successfully', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData),
      });

      const voice = { id: 'voice123', name: 'Test Voice', language: 'vi-VN' };
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

      const voice = { id: 'voice123', name: 'Test Voice', language: 'vi-VN' };
      await expect(provider.synthesize('Hello', voice)).rejects.toThrow('ElevenLabs API error: 401');
    });
  });

  describe('getVoices', () => {
    it('should return list of voices from API', async () => {
      const mockVoices = {
        voices: [
          { voice_id: 'voice1', name: 'Voice 1', languages: ['vi-VN'], labels: { gender: 'female' } },
          { voice_id: 'voice2', name: 'Voice 2', languages: ['en-US'], labels: { gender: 'male' } },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoices),
      });

      const voices = await provider.getVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0]).toEqual({
        id: 'voice1',
        name: 'Voice 1',
        language: 'vi-VN',
        gender: 'female',
      });
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(provider.getVoices()).rejects.toThrow('ElevenLabs API error: 401');
    });

    it('should handle missing labels', async () => {
      const mockVoices = {
        voices: [
          { voice_id: 'voice1', name: 'Voice 1', languages: ['vi-VN'] },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoices),
      });

      const voices = await provider.getVoices();
      expect(voices[0].gender).toBe('unknown');
    });
  });

  describe('stream', () => {
    it('should throw error for empty text', async () => {
      await expect(
        provider.stream('', { id: 'voice123', name: 'Test Voice', language: 'vi-VN' })
      ).rejects.toThrow('Invalid text');
    });

    it('should return readable stream', async () => {
      const mockStream = new ReadableStream();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const voice = { id: 'voice123', name: 'Test Voice', language: 'vi-VN' };
      const stream = await provider.stream('Hello', voice);
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const voice = { id: 'voice123', name: 'Test Voice', language: 'vi-VN' };
      await expect(provider.stream('Hello', voice)).rejects.toThrow('ElevenLabs API error: 401');
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
      const expectedCost = (text.length / 1000) * 0.03;
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
      const mockVoices = {
        voices: [{ voice_id: 'voice1', name: 'Voice 1', languages: ['vi-VN'] }],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoices),
      });

      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});
