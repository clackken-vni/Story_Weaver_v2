export interface AIProvider {
  generateStory(prompt: string, options?: GenerationOptions): Promise<StoryGeneration>;
  validatePrompt(prompt: string): boolean;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  genre?: string;
}

export interface StoryGeneration {
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export class AIProviderError extends Error {
  constructor(message: string, public provider: string, public statusCode?: number) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export function createAIProvider(type: 'openai' | 'gemini' | 'mock'): AIProvider {
  switch (type) {
    case 'mock':
      return new MockAIProvider();
    default:
      return new MockAIProvider();
  }
}

class MockAIProvider implements AIProvider {
  async generateStory(prompt: string, options?: GenerationOptions): Promise<StoryGeneration> {
    return {
      content: `Mock generated story for: ${prompt.substring(0, 50)}...`,
      title: 'Generated Story',
      metadata: { temperature: options?.temperature ?? 0.7 }
    };
  }

  validatePrompt(prompt: string): boolean {
    return prompt.length > 0 && prompt.length <= 10000;
  }
}