import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProjectRepository, Project, UpdateProjectInput } from '../db/repository.js';

class MockPool {
  private data: Map<string, any[]> = new Map();
  private nextId = 1;

  setData(key: string, rows: any[]) {
    this.data.set(key, rows);
  }

  async query(text: string, values?: any[]): Promise<{ rows: any[] }> {
    if (text.includes('CREATE TABLE')) {
      return { rows: [] };
    }
    if (text.includes('INSERT')) {
      const newRow = {
        id: `proj-${this.nextId++}`,
        user_id: values?.[0] || 'user-123',
        title: values?.[1] || 'Untitled',
        current_step: 'choose_genre',
        step_data: {},
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.data.set('projects', [...(this.data.get('projects') || []), newRow]);
      return { rows: [newRow] };
    }
    if (text.includes('SELECT') && text.includes('WHERE id')) {
      const id = values?.[0];
      const rows = (this.data.get('projects') || []).filter((r: any) => r.id === id);
      return { rows };
    }
    if (text.includes('SELECT') && text.includes('user_id')) {
      const userId = values?.[0];
      const rows = (this.data.get('projects') || []).filter((r: any) => r.user_id === userId);
      return { rows };
    }
    if (text.includes('SELECT')) {
      return { rows: this.data.get('projects') || [] };
    }
    if (text.includes('UPDATE')) {
      const id = values?.[values.length - 1];
      const projects = this.data.get('projects') || [];
      const idx = projects.findIndex((r: any) => r.id === id);
      if (idx >= 0) {
        const updated = { ...projects[idx], updated_at: new Date() };
        // Apply updates based on field order in SET clause (excluding updated_at and id)
        // Repository builds: title, current_step, step_data in order
        const setClause = text.match(/SET (.+) WHERE/i)?.[1] || '';
        const assignments = setClause.split(',').map((s: string) => s.trim());
        let valueIdx = 0;
        for (const assignment of assignments) {
          if (assignment.includes('updated_at')) continue;
          const fieldName = assignment.split('=')[0].trim();
          const v = values && values[valueIdx];
          if (fieldName === 'title' && v !== undefined) {
            updated.title = v;
          } else if (fieldName === 'current_step' && v !== undefined) {
            updated.current_step = v;
          } else if (fieldName === 'step_data' && v !== undefined) {
            updated.step_data = typeof v === 'string' ? JSON.parse(v) : v;
          }
          valueIdx++;
        }
        projects[idx] = updated;
        return { rows: [projects[idx]] };
      }
      return { rows: [] };
    }
    if (text.includes('DELETE')) {
      const id = values?.[0];
      const projects = (this.data.get('projects') || []).filter((r: any) => r.id !== id);
      this.data.set('projects', projects);
      return { rows: [] };
    }
    return { rows: [] };
  }

  async connect() {
    return {
      release: () => {},
      query: (text: string, values?: any[]) => this.query(text, values),
    };
  }
}

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let mockPool: MockPool;

  beforeEach(() => {
    mockPool = new MockPool();
    repository = new ProjectRepository(mockPool as any);
  });

  describe('initSchema', () => {
    it('should execute without error', async () => {
      await expect(repository.initSchema()).resolves.toBeUndefined();
    });
  });

  describe('createProject', () => {
    it('should create a project', async () => {
      const project = await repository.createProject('user-123', 'My Story');

      expect(project).toBeDefined();
      expect(project.userId).toBe('user-123');
      expect(project.title).toBe('My Story');
      expect(project.currentStep).toBe('choose_genre');
      expect(project.stepData).toEqual({});
    });
  });

  describe('getProject', () => {
    it('should return project when found', async () => {
      await repository.createProject('user-123', 'Test');

      const project = await repository.getProject('proj-1');

      expect(project).toBeDefined();
      expect(project?.id).toBe('proj-1');
    });

    it('should return null when not found', async () => {
      const project = await repository.getProject('nonexistent');
      expect(project).toBeNull();
    });
  });

  describe('getProjectsByUser', () => {
    it('should return projects for user', async () => {
      await repository.createProject('user-123', 'Story 1');
      await repository.createProject('user-123', 'Story 2');

      const projects = await repository.getProjectsByUser('user-123');

      expect(projects).toHaveLength(2);
    });

    it('should return empty array when no projects', async () => {
      const projects = await repository.getProjectsByUser('user-456');
      expect(projects).toHaveLength(0);
    });
  });

  describe('updateProject', () => {
    it('should update project title', async () => {
      await repository.createProject('user-123', 'Original');

      const project = await repository.updateProject('proj-1', { title: 'Updated' });

      expect(project?.title).toBe('Updated');
    });

    it('should update current step', async () => {
      await repository.createProject('user-123', 'Test');

      const project = await repository.updateProject('proj-1', { currentStep: 'define_characters' });

      expect(project?.currentStep).toBe('define_characters');
    });

    it('should return null when not found', async () => {
      const project = await repository.updateProject('nonexistent', { title: 'Test' });
      expect(project).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      await repository.createProject('user-123', 'Test');

      await repository.deleteProject('proj-1');

      const project = await repository.getProject('proj-1');
      expect(project).toBeNull();
    });

    it('should handle deleting nonexistent project', async () => {
      await expect(repository.deleteProject('nonexistent')).resolves.toBeUndefined();
    });
  });
});
