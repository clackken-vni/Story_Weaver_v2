import asyncpg
from app.config import config


class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(config.database_url)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    async def init_schema(self):
        async with self.pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS kb (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    description TEXT,
                    genres TEXT[] DEFAULT '{}',
                    created_by UUID NOT NULL,
                    status TEXT DEFAULT 'pending',
                    document_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS kb_documents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags TEXT[] DEFAULT '{}',
                    trust_score FLOAT DEFAULT 0.0,
                    verified BOOLEAN DEFAULT FALSE,
                    source_urls TEXT[] DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_kb_documents_kb_id ON kb_documents(kb_id);
                CREATE INDEX IF NOT EXISTS idx_kb_documents_tags ON kb_documents USING GIN(tags);
                CREATE INDEX IF NOT EXISTS idx_kb_documents_verified ON kb_documents(verified);

                CREATE TABLE IF NOT EXISTS kb_jobs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
                    status TEXT DEFAULT 'pending',
                    progress INT DEFAULT 0,
                    current_step TEXT,
                    total_steps INT DEFAULT 0,
                    completed_steps INT DEFAULT 0,
                    estimated_time TEXT,
                    logs JSONB DEFAULT '[]',
                    results JSONB,
                    errors JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_kb_jobs_kb_id ON kb_jobs(kb_id);
                CREATE INDEX IF NOT EXISTS idx_kb_jobs_status ON kb_jobs(status);

                CREATE TABLE IF NOT EXISTS kb_project_mapping (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
                    project_id UUID NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(kb_id, project_id)
                );

                CREATE INDEX IF NOT EXISTS idx_kb_project_mapping_project ON kb_project_mapping(project_id);
            ''')


db = Database()
