import { v4 as uuidv4 } from 'uuid';
import { BaseTTSProvider, Voice, SynthesisOptions, SynthesisResult, CostEstimate, TTSError } from '../providers/base.js';
import { VbeeProvider } from '../providers/vbee.js';
import { GoogleTTSProvider } from '../providers/google.js';
import { ElevenLabsProvider } from '../providers/elevenlabs.js';
import { AudioStorage } from '../storage/minio.js';

export interface TTSConfig {
  vbee?: { apiKey: string; apiUrl?: string };
  google?: { credentials?: Record<string, unknown>; projectId?: string };
  elevenlabs?: { apiKey: string; baseUrl?: string };
  storage?: { endPoint?: string; port?: number; useSSL?: boolean; accessKey: string; secretKey: string; bucket?: string };
  defaultProvider?: string;
}

export class TTSService {
  private providers: Map<string, BaseTTSProvider> = new Map();
  private defaultProvider: string | null = null;
  private storage: AudioStorage | null = null;

  registerProvider(name: string, provider: BaseTTSProvider): void {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setStorage(storage: AudioStorage): void {
    this.storage = storage;
  }

  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  getProvider(name?: string): BaseTTSProvider | undefined {
    return this.providers.get(name || this.defaultProvider || '');
  }

  async synthesize(text: string, voice: Voice, options: SynthesisOptions & { provider?: string } = {}): Promise<SynthesisResult> {
    const providerName = options.provider || this.defaultProvider || undefined;
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new TTSError(`Provider ${providerName} not found`, providerName || 'unknown');
    }

    const result = await provider.synthesize(text, voice, options);

    if (this.storage) {
      const key = `audio/${uuidv4()}.mp3`;
      const url = await this.storage.uploadAudio(key, result.audioData);
      result.url = url;
    }

    return result;
  }

  async getVoices(providerName?: string): Promise<Voice[]> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new TTSError(`Provider ${providerName || this.defaultProvider} not found`, providerName || this.defaultProvider || 'unknown');
    }
    return provider.getVoices();
  }

  async stream(text: string, voice: Voice, providerName?: string): Promise<ReadableStream> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new TTSError(`Provider ${providerName || this.defaultProvider} not found`, providerName || this.defaultProvider || 'unknown');
    }
    return provider.stream(text, voice);
  }

  estimateCost(text: string, providerName?: string): CostEstimate {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new TTSError(`Provider ${providerName || this.defaultProvider} not found`, providerName || this.defaultProvider || 'unknown');
    }
    return provider.estimateCost(text);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }
    return results;
  }

  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export function createTTSService(config: TTSConfig): TTSService {
  const service = new TTSService();

  if (config.vbee?.apiKey) {
    service.registerProvider('vbee', new VbeeProvider(config.vbee));
  }

  if (config.google) {
    service.registerProvider('google', new GoogleTTSProvider(config.google));
  }

  if (config.elevenlabs?.apiKey) {
    service.registerProvider('elevenlabs', new ElevenLabsProvider(config.elevenlabs));
  }

  if (config.storage?.accessKey && config.storage?.secretKey) {
    service.setStorage(new AudioStorage(config.storage));
  }

  if (config.defaultProvider) {
    service.setDefaultProvider(config.defaultProvider);
  }

  return service;
}
