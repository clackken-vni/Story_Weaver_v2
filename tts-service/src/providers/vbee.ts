import { BaseTTSProvider, Voice, SynthesisOptions, SynthesisResult, CostEstimate, TTSError } from './base.js';

interface VbeeConfig {
  apiKey: string;
  apiUrl?: string;
}

export class VbeeProvider extends BaseTTSProvider {
  private apiUrl: string;

  constructor(config: VbeeConfig) {
    super(config as unknown as Record<string, unknown>);
    this.apiUrl = config.apiUrl || 'https://api.vbee.vn/v1/synthesize';
  }

  async synthesize(text: string, voice: Voice, options: SynthesisOptions = {}): Promise<SynthesisResult> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'vbee');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(this.config as unknown as VbeeConfig).apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voice.id,
        speed: options.speed || 1.0,
        format: options.format || 'mp3',
      }),
    });

    if (!response.ok) {
      throw new TTSError(`Vbee API error: ${response.status}`, 'vbee', response.status);
    }

    const audioData = await response.arrayBuffer();
    const duration = this.estimateDuration(text);

    return {
      audioData: Buffer.from(audioData),
      duration,
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: 'vbee_female', name: 'Vbee Female (Vietnamese)', language: 'vi-VN', gender: 'female' },
      { id: 'vbee_male', name: 'Vbee Male (Vietnamese)', language: 'vi-VN', gender: 'male' },
      { id: 'vbee_female_central', name: 'Vbee Female Central (Vietnamese)', language: 'vi-VN', gender: 'female' },
    ];
  }

  async stream(text: string, voice: Voice): Promise<ReadableStream> {
    if (!this.validateText(text)) {
      throw new TTSError('Invalid text', 'vbee');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(this.config as unknown as VbeeConfig).apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voice.id,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new TTSError(`Vbee API error: ${response.status}`, 'vbee', response.status);
    }

    return response.body as ReadableStream;
  }

  estimateCost(text: string): CostEstimate {
    const characters = text.length;
    const rate = 100;
    return {
      estimatedCost: (characters / 1000) * rate,
      currency: 'VND',
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
