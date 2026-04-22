import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createTTSService } from './services/ttsService.js';
import { registerTTSRoutes } from './routes/index.js';

const ttsService = createTTSService({
  vbee: process.env.VBEE_API_KEY ? { apiKey: process.env.VBEE_API_KEY } : undefined,
  google: process.env.GOOGLE_APPLICATION_CREDENTIALS ? {
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    projectId: process.env.GOOGLE_PROJECT_ID,
  } : undefined,
  elevenlabs: process.env.ELEVENLABS_API_KEY ? { apiKey: process.env.ELEVENLABS_API_KEY } : undefined,
  storage: process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY ? {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET || 'storyweaver-audio',
  } : undefined,
});

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

registerTTSRoutes(app, { service: ttsService });

const port = parseInt(process.env.PORT || '3003', 10);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`TTS service running at ${address}`);
});
