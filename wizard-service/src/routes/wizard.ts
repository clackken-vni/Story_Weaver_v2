import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ProjectRepository } from '../db/repository.js';

interface CreateProjectBody {
  userId: string;
  title: string;
}

interface UpdateProjectBody {
  title?: string;
  currentStep?: string;
  stepData?: Record<string, unknown>;
}

interface ProjectParams {
  id: string;
}

export const wizardRoutes: FastifyPluginAsync<{ repository: ProjectRepository }> = async (
  app: FastifyInstance,
  options
) => {
  const { repository } = options;

  app.get('/health', async () => {
    return { status: 'ok', service: 'wizard-service' };
  });

  app.post<{ Body: CreateProjectBody }>(
    '/api/v1/projects',
    async (request, reply) => {
      const { userId, title } = request.body;

      if (!userId) {
        return reply.status(400).send({ error: 'userId is required' });
      }
      if (!title) {
        return reply.status(400).send({ error: 'title is required' });
      }

      const project = await repository.createProject(userId, title);
      return reply.status(201).send(project);
    }
  );

  app.get<{ Params: ProjectParams }>(
    '/api/v1/projects/:id',
    async (request, reply) => {
      const project = await repository.getProject(request.params.id);
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      return project;
    }
  );

  app.get('/api/v1/projects', async (request, reply) => {
    const { userId } = request.query as { userId?: string };
    if (!userId) {
      return reply.status(400).send({ error: 'userId query parameter is required' });
    }
    const projects = await repository.getProjectsByUser(userId);
    return { projects };
  });

  app.patch<{ Params: ProjectParams; Body: UpdateProjectBody }>(
    '/api/v1/projects/:id',
    async (request, reply) => {
      const project = await repository.updateProject(
        request.params.id,
        request.body
      );
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      return project;
    }
  );

  app.delete<{ Params: ProjectParams }>(
    '/api/v1/projects/:id',
    async (request, reply) => {
      await repository.deleteProject(request.params.id);
      return reply.status(204).send();
    }
  );
};
