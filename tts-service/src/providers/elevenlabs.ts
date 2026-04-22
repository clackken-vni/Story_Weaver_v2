import { BaseTTSProvider, Voice, SynthesisOptions, SynthesisResult, CostEstimate, TTSError } from './base.js';

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl?: string;
}

export class ElevenLabsProvider extends BaseTTSProvider {
  private baseUrl: string;

  constructor(config: ElevenLabsConfig) {
    super(config as unknown as Record<string, unknown>);
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io/v1';
  }

  async synthesize(text: string, voice: Voice, options: SynthesisOptions = {}): Promise<SynthesisResult> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'elevenlabs');
    }

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': (this.config as unknown as ElevenLabsConfig).apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: options.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity || 0.75,
          style: options.style || 0,
          use_speaker_boost: options.speakerBoost ?? true,
        },
      }),
    });

    if (!response.ok) {
      throw new TTSError(`ElevenLabs API error: ${response.status}`, 'elevenlabs', response.status);
    }

    const audioData = await response.arrayBuffer();
    return {
      audioData: Buffer.from(audioData),
      duration: this.estimateDuration(text),
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': (this.config as unknown as ElevenLabsConfig).apiKey },
    });

    if (!response.ok) {
      throw new TTSError(`ElevenLabs API error: ${response.status}`, 'elevenlabs', response.status);
    }

    const data = await response.json() as { voices: Array<{ voice_id: string; name: string; languages: string[]; labels?: { gender?: string } }> };
    return data.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      language: v.languages[0] || 'vi-VN',
      gender: v.labels?.gender || 'unknown',
    }));
  }

  async stream(text: string, voice: Voice): Promise<ReadableStream> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'elevenlabs');
    }

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': (this.config as unknown as ElevenLabsConfig).apiKey,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new TTSError(`ElevenLabs API error: ${response.status}`, 'elevenlabs', response.status);
    }

    return response.body as ReadableStream;
  }

  estimateCost(text: string): CostEstimate {
    const characters = text.length;
    const rate = 0.03;
    return {
      estimatedCost: (characters / 1000) * rate,
      currency: 'USD',
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const voices = await this.getVoices();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}
