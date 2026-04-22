import { Pool } from 'pg';

export interface Project {
  id: string;
  userId: string;
  title: string;
  currentStep: string;
  stepData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  userId: string;
  title: string;
}

export interface UpdateProjectInput {
  title?: string;
  currentStep?: string;
  stepData?: Record<string, unknown>;
}

export class ProjectRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          current_step TEXT DEFAULT 'choose_genre',
          step_data JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS generation_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          step TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          result JSONB,
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_generation_runs_project_id ON generation_runs(project_id);
        CREATE INDEX IF NOT EXISTS idx_generation_runs_status ON generation_runs(status);
      `);
    } finally {
      client.release();
    }
  }

  async createProject(userId: string, title: string): Promise<Project> {
    const result = await this.pool.query(
      `INSERT INTO projects (user_id, title) VALUES ($1, $2) RETURNING *`,
      [userId, title]
    );
    return this.mapRow(result.rows[0]);
  }

  async getProject(id: string): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    const result = await this.pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows.map(this.mapRow);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.currentStep !== undefined) {
      fields.push(`current_step = $${paramIndex++}`);
      values.push(input.currentStep);
    }
    if (input.stepData !== undefined) {
      fields.push(`step_data = $${paramIndex++}`);
      values.push(JSON.stringify(input.stepData));
    }

    if (fields.length === 0) {
      return this.getProject(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async deleteProject(id: string): Promise<void> {
    await this.pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }

  private mapRow(row: any): Project {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      currentStep: row.current_step,
      stepData: row.step_data || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
