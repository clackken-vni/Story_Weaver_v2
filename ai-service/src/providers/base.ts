export interface GenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface GenerationResult {
  content: string;
  tokens: number;
  finishReason: string;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  generate(request: GenerationRequest): Promise<GenerationResult>;
  validateRequest(request: GenerationRequest): boolean;
}

export class AIProviderError extends Error {
  constructor(message: string, public provider: string, public statusCode?: number) {
    super(message);
    this.name = 'AIProviderError';
  }
}