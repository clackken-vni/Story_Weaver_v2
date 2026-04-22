import { AIProvider, GenerationRequest, GenerationResult } from './base.js';

export class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    // Mock implementation - in production would call Anthropic API
    return {
      content: `[Anthropic] Generated content for: ${request.prompt.substring(0, 50)}`,
      tokens: Math.floor(request.prompt.length / 10),
      finishReason: 'stop',
      metadata: { provider: 'anthropic' }
    };
  }

  validateRequest(request: GenerationRequest): boolean {
    return request.prompt.length > 0 && request.prompt.length <= 5000;
  }
}
