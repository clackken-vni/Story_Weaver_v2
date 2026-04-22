import Fastify, { FastifyInstance } from 'fastify';
import { AIService } from './services/aiService.js';
import { OpenAIProvider, GeminiProvider, createProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { registerAIRoutes } from './routes/aiRoutes.js';

// Create Fastify instance
const fastify = Fastify({ logger: true });

// Create AI Service
const aiService = new AIService(new GeminiProvider(process.env.GEMINI_API_KEY || 'mock-gemini-key'));

// Register providers
aiService.providers = {
  gemini: new GeminiProvider(process.env.GEMINI_API_KEY || 'mock-gemini-key'),
  openai: new OpenAIProvider(process.env.OPENAI_API_KEY || 'mock-openai-key'),
  anthropic: new AnthropicProvider(process.env.ANTHROPIC_API_KEY || 'mock-anthropic-key'),
};

// Register routes
async function build() {
  await registerAIRoutes(fastify, aiService);
}

// Export for testing
export async function startServer(port: number = 3002): Promise<FastifyInstance> {
  await build();

  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`AI Service running on port ${port}`);

  return fastify;
}

// Start server if run directly
const PORT = parseInt(process.env.PORT || '3002', 10);

startServer(PORT).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
