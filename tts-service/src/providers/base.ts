export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: string;
}

export interface SynthesisOptions {
  format?: string;
  sampleRate?: number;
  speed?: number;
  stability?: number;
  similarity?: number;
  style?: number;
  speakerBoost?: boolean;
  model?: string;
}

export interface SynthesisResult {
  audioData: Buffer;
  duration: number;
  cost: number;
  url?: string;
}

export interface CostEstimate {
  estimatedCost: number;
  currency: string;
}

export abstract class BaseTTSProvider {
  constructor(protected config: Record<string, unknown>) {}

  abstract synthesize(text: string, voice: Voice, options?: SynthesisOptions): Promise<SynthesisResult>;

  abstract getVoices(): Promise<Voice[]>;

  abstract stream(text: string, voice: Voice): Promise<ReadableStream>;

  abstract estimateCost(text: string): CostEstimate;

  abstract healthCheck(): Promise<boolean>;

  protected estimateDuration(text: string): number {
    return text.length / 150;
  }

  protected validateText(text: string): boolean {
    return text.length > 0 && text.length <= 5000;
  }
}

export class TTSError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TTSError';
  }
}
