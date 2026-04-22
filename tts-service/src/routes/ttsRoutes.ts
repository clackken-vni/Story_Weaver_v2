import { TTSService, TTSConfig } from '../services/ttsService.js';
import { Voice, SynthesisOptions } from '../providers/base.js';

export interface TTSRoutesOptions {
  service: TTSService;
}

export async function registerTTSRoutes(fastify: { post: Function; get: Function; decorate: Function }, options: TTSRoutesOptions): Promise<void> {
  const { service } = options;

  fastify.post('/api/v1/synthesize', async (request: { body: { text: string; voice: Voice; provider?: string; options?: SynthesisOptions } }, reply: { send: Function }) => {
    const { text, voice, provider, options: synthesisOptions } = request.body;

    if (!text || !voice) {
      return reply.send({ error: 'Missing required fields: text and voice' });
    }

    const result = await service.synthesize(text, voice, { provider, ...synthesisOptions });
    return reply.send(result);
  });

  fastify.get('/api/v1/voices', async (request: { query: { provider?: string } }, reply: { send: Function }) => {
    const { provider } = request.query;
    const voices = await service.getVoices(provider);
    return reply.send({ voices });
  });

  fastify.post('/api/v1/estimate-cost', async (request: { body: { text: string; provider?: string } }, reply: { send: Function }) => {
    const { text, provider } = request.body;

    if (!text) {
      return reply.send({ error: 'Missing required field: text' });
    }

    const estimate = service.estimateCost(text, provider);
    return reply.send(estimate);
  });

  fastify.get('/api/v1/providers', async (_request: unknown, reply: { send: Function }) => {
    const providers = service.getRegisteredProviders();
    return reply.send({ providers });
  });

  fastify.get('/health', async () => {
    const health = await service.healthCheck();
    return { status: 'ok', service: 'tts-service', providers: health };
  });
}
