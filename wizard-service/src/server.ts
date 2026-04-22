import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Pool } from 'pg';
import { ProjectRepository } from './db/repository.js';
import { wizardRoutes } from './routes/wizard.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const repository = new ProjectRepository(pool);

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(wizardRoutes, { repository });

const port = parseInt(process.env.PORT || '3001', 10);

// Initialize database schema
await repository.initSchema();

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Wizard service running at ${address}`);
});
