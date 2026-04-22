import { AIProvider, GenerationRequest, GenerationResult } from '../providers/base.js';

export class AIService {
  providers: Record<string, AIProvider> = {};
  private defaultProvider: string | null = null;

  constructor(provider?: AIProvider) {
    if (provider) {
      this.providers['default'] = provider;
      this.defaultProvider = 'default';
    }
  }

  registerProvider(name: string, provider: AIProvider): void {
    this.providers[name] = provider;
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setDefaultProvider(name: string): void {
    if (this.providers[name]) {
      this.defaultProvider = name;
    }
  }

  getProvider(name?: string): AIProvider | undefined {
    if (name) {
      return this.providers[name];
    }
    return this.defaultProvider ? this.providers[this.defaultProvider] : undefined;
  }

  async generate(request: GenerationRequest, options: { provider?: string } = {}): Promise<GenerationResult> {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider || 'default'} not found`);
    }
    if (!provider.validateRequest(request)) {
      throw new Error('Invalid request');
    }
    return provider.generate(request);
  }

  validateRequest(request: GenerationRequest): boolean {
    return request.prompt.length > 0 && request.prompt.length <= 5000;
  }
}