import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BaseTTSProvider, Voice, SynthesisOptions, SynthesisResult, CostEstimate, TTSError } from '../providers/base.js';

class MockTTSProvider extends BaseTTSProvider {
  async synthesize(text: string, voice: Voice, options?: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'mock');
    }
    return {
      audioData: Buffer.from(`Mock audio for: ${text}`),
      duration: this.estimateDuration(text),
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: 'mock_voice_1', name: 'Mock Voice 1', language: 'vi-VN', gender: 'female' },
      { id: 'mock_voice_2', name: 'Mock Voice 2', language: 'vi-VN', gender: 'male' },
    ];
  }

  async stream(_text: string, _voice: Voice): Promise<ReadableStream> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from('mock audio data'));
        controller.close();
      },
    });
  }

  estimateCost(text: string): CostEstimate {
    const characters = text.length;
    return {
      estimatedCost: (characters / 1000) * 10,
      currency: 'USD',
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

describe('BaseTTSProvider', () => {
  let provider: MockTTSProvider;

  beforeEach(() => {
    provider = new MockTTSProvider({});
  });

  describe('validateText', () => {
    it('should return false for empty text', () => {
      expect(provider.validateText('')).toBe(false);
    });

    it('should return false for text exceeding 5000 characters', () => {
      const longText = 'x'.repeat(5001);
      expect(provider.validateText(longText)).toBe(false);
    });

    it('should return true for valid text', () => {
      expect(provider.validateText('Hello world')).toBe(true);
    });

    it('should return true for text exactly 5000 characters', () => {
      const maxText = 'x'.repeat(5000);
      expect(provider.validateText(maxText)).toBe(true);
    });
  });

  describe('estimateDuration', () => {
    it('should estimate duration based on text length', () => {
      const text = 'Hello world';
      const expectedDuration = text.length / 150;
      expect(provider.estimateDuration(text)).toBe(expectedDuration);
    });

    it('should return 0 for empty text', () => {
      expect(provider.estimateDuration('')).toBe(0);
    });
  });

  describe('synthesize', () => {
    it('should synthesize speech successfully', async () => {
      const voice: Voice = { id: 'voice1', name: 'Test Voice', language: 'vi-VN' };
      const result = await provider.synthesize('Hello', voice);

      expect(result.audioData).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThanOrEqual(0);
    });

    it('should throw TTSError for empty text', async () => {
      const voice: Voice = { id: 'voice1', name: 'Test Voice', language: 'vi-VN' };
      await expect(provider.synthesize('', voice)).rejects.toThrow(TTSError);
    });

    it('should pass options to synthesize', async () => {
      const voice: Voice = { id: 'voice1', name: 'Test Voice', language: 'vi-VN' };
      const options: SynthesisOptions = { speed: 1.5, format: 'mp3' };
      const result = await provider.synthesize('Hello', voice, options);

      expect(result.audioData).toBeInstanceOf(Buffer);
    });
  });

  describe('getVoices', () => {
    it('should return list of voices', async () => {
      const voices = await provider.getVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0]).toHaveProperty('id');
      expect(voices[0]).toHaveProperty('name');
      expect(voices[0]).toHaveProperty('language');
    });
  });

  describe('stream', () => {
    it('should return a readable stream', async () => {
      const voice: Voice = { id: 'voice1', name: 'Test Voice', language: 'vi-VN' };
      const stream = await provider.stream('Hello', voice);
      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost based on text length', () => {
      const text = 'Hello world';
      const cost = provider.estimateCost(text);
      expect(cost.estimatedCost).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
    });
  });

  describe('healthCheck', () => {
    it('should return true when healthy', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });
  });
});

describe('TTSError', () => {
  it('should create error with provider info', () => {
    const error = new TTSError('Test error', 'vbee', 500);
    expect(error.message).toBe('Test error');
    expect(error.provider).toBe('vbee');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('TTSError');
  });

  it('should work without status code', () => {
    const error = new TTSError('Test error', 'google');
    expect(error.message).toBe('Test error');
    expect(error.provider).toBe('google');
    expect(error.statusCode).toBeUndefined();
  });

  it('should be instance of Error', () => {
    const error = new TTSError('Test error', 'elevenlabs');
    expect(error).toBeInstanceOf(Error);
  });
});
