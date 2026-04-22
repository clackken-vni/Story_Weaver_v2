import { createTTSService, TTSConfig } from './services/ttsService.js';
import { registerTTSRoutes } from './routes/index.js';

interface AppConfig {
  port?: number;
  host?: string;
  vbeeApiKey?: string;
  googleCredentials?: Record<string, unknown>;
  googleProjectId?: string;
  elevenlabsApiKey?: string;
  minioEndpoint?: string;
  minioPort?: number;
  minioUseSSL?: boolean;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioBucket?: string;
  defaultProvider?: string;
}

export async function build(config: AppConfig = {}) {
  const ttsService = createTTSService({
    vbee: config.vbeeApiKey ? { apiKey: config.vbeeApiKey } : undefined,
    google: config.googleCredentials ? { credentials: config.googleCredentials, projectId: config.googleProjectId } : undefined,
    elevenlabs: config.elevenlabsApiKey ? { apiKey: config.elevenlabsApiKey } : undefined,
    storage: config.minioAccessKey && config.minioSecretKey ? {
      endPoint: config.minioEndpoint,
      port: config.minioPort,
      useSSL: config.minioUseSSL,
      accessKey: config.minioAccessKey,
      secretKey: config.minioSecretKey,
      bucket: config.minioBucket,
    } : undefined,
    defaultProvider: config.defaultProvider,
  });

  return { ttsService, registerRoutes: (fastify: any) => registerTTSRoutes(fastify, { service: ttsService }) };
}

export { createTTSService };
export type { TTSConfig };
