import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '../services/aiService.js';

interface GenerateBody {
  prompt: string;
  provider?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
  };
}

interface GenerateJsonBody extends GenerateBody {
  schema?: Record<string, unknown>;
}

interface ModelsQuery {
  provider?: string;
}

export async function registerAIRoutes(fastify: FastifyInstance, aiService: AIService): Promise<void> {
  // POST /api/v1/generate - Generate text completion
  fastify.post<{ Body: GenerateBody }>('/api/v1/generate', async (request: FastifyRequest<{ Body: GenerateBody }>, reply: FastifyReply) => {
    const { prompt, provider, options } = request.body;

    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'prompt is required and must be a string' });
    }

    try {
      const result = await aiService.generate({ prompt, ...options });
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  });

  // POST /api/v1/generate/json - Generate JSON response
  fastify.post<{ Body: GenerateJsonBody }>('/api/v1/generate/json', async (request: FastifyRequest<{ Body: GenerateJsonBody }>, reply: FastifyReply) => {
    const { prompt, schema, provider, options } = request.body;

    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'prompt is required and must be a string' });
    }

    // For now, generate returns text - in production this would parse JSON
    try {
      const result = await aiService.generate({ prompt, ...options });
      let content = result.content;

      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }

      // Try to parse as JSON
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch {
        // If schema is required, return error; otherwise return raw content
        if (schema) {
          return reply.status(500).send({ error: 'Failed to parse response as JSON' });
        }
        return reply.send({ data: content });
      }

      if (schema) {
        // Basic validation - in production use a schema validator
        return reply.send({ data: parsedData, schema });
      }

      return reply.send({ data: parsedData });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  });

  // GET /api/v1/models - List available models
  fastify.get<{ Querystring: ModelsQuery }>('/api/v1/models', async (request: FastifyRequest<{ Querystring: ModelsQuery }>, reply: FastifyReply) => {
    const { provider } = request.query;

    // Return mock models based on provider
    const models: Record<string, Array<{ id: string; name: string; contextWindow: number }>> = {
      openai: [
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
      ],
      gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000 },
      ],
      anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000 },
        { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextWindow: 200000 },
      ],
    };

    if (provider) {
      if (!models[provider]) {
        return reply.status(400).send({ error: `Unknown provider: ${provider}` });
      }
      return reply.send({ models: models[provider] });
    }

    // Return all models
    return reply.send({ models });
  });

  // GET /health - Health check
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'ai-service' };
  });
}
