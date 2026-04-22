import { AIProvider, GenerationRequest, GenerationResult } from './base.js';

export class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    // Mock implementation - in production would call OpenAI API
    return {
      content: `[OpenAI] Generated content for: ${request.prompt.substring(0, 50)}`,
      tokens: Math.floor(request.prompt.length / 10),
      finishReason: 'stop',
      metadata: { provider: 'openai' }
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return request.prompt.length > 0 && request.prompt.length <= 5000;
  }
}

export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    // Mock implementation - in production would call Gemini API
    return {
      content: `[Gemini] Generated content for: ${request.prompt.substring(0, 50)}`,
      tokens: Math.floor(request.prompt.length / 10),
      finishReason: 'stop',
      metadata: { provider: 'gemini' }
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return request.prompt.length > 0 && request.prompt.length <= 5000;
  }
}

export function createProvider(type: 'openai' | 'gemini', apiKey: string): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}