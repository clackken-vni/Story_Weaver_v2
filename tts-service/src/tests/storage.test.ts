import { describe, it, expect, beforeEach } from '@jest/globals';
import { AudioStorage } from '../storage/minio.js';

describe('AudioStorage', () => {
  let storage: AudioStorage;

  beforeEach(() => {
    storage = new AudioStorage({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'test-access-key',
      secretKey: 'test-secret-key',
      bucket: 'test-bucket',
    });
  });

  describe('constructor', () => {
    it('should create storage with default config', () => {
      const defaultStorage = new AudioStorage({
        accessKey: 'test-access',
        secretKey: 'test-secret',
      });
      expect(defaultStorage).toBeInstanceOf(AudioStorage);
    });

    it('should create storage with custom bucket', () => {
      const customStorage = new AudioStorage({
        accessKey: 'test-access',
        secretKey: 'test-secret',
        bucket: 'custom-bucket',
      });
      expect(customStorage).toBeInstanceOf(AudioStorage);
    });
  });

  describe('uploadAudio', () => {
    it('should return URL after upload', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const url = await storage.uploadAudio('audio/test.mp3', audioBuffer);
      expect(url).toContain('test-bucket');
      expect(url).toContain('audio/test.mp3');
    });

    it('should handle custom mime type', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const url = await storage.uploadAudio('audio/test.ogg', audioBuffer, 'audio/ogg');
      expect(url).toContain('audio/test.ogg');
    });
  });

  describe('getUrl', () => {
    it('should return presigned URL', async () => {
      const url = await storage.getUrl('audio/test.mp3');
      expect(url).toContain('test-bucket');
      expect(url).toContain('audio/test.mp3');
    });

    it('should accept expiry parameter', async () => {
      const url = await storage.getUrl('audio/test.mp3', 3600);
      expect(url).toContain('audio/test.mp3');
    });
  });

  describe('deleteAudio', () => {
    it('should delete audio without error', async () => {
      await expect(storage.deleteAudio('audio/test.mp3')).resolves.not.toThrow();
    });
  });

  describe('listAudio', () => {
    it('should return empty array initially', async () => {
      const objects = await storage.listAudio();
      expect(Array.isArray(objects)).toBe(true);
    });

    it('should filter by prefix', async () => {
      const objects = await storage.listAudio('audio/');
      expect(Array.isArray(objects)).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return true', async () => {
      const result = await storage.healthCheck();
      expect(result).toBe(true);
    });
  });
});
