import json
from typing import List, Optional, Any
from datetime import datetime, timezone
from app.database import Database
from app.models.job import Job, JobCreate


class JobRepository:
    def __init__(self, db: Database):
        self.db = db

    async def create(self, data: JobCreate) -> Job:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('''
                INSERT INTO kb_jobs (kb_id, total_steps)
                VALUES ($1, $2)
                RETURNING *
            ''', data.kb_id, data.total_steps)
            return self._row_to_job(row)

    async def get_by_id(self, job_id: str) -> Optional[Job]:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM kb_jobs WHERE id = $1', job_id)
            return self._row_to_job(row) if row else None

    async def list_by_kb(self, kb_id: str) -> List[Job]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM kb_jobs WHERE kb_id = $1 ORDER BY created_at DESC', kb_id)
            return [self._row_to_job(row) for row in rows]

    async def list_all(self) -> List[Job]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM kb_jobs ORDER BY created_at DESC')
            return [self._row_to_job(row) for row in rows]

    async def update_progress(self, job_id: str, status: str, progress: int, current_step: str, completed_steps: int) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET status = $1, progress = $2, current_step = $3,
                completed_steps = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5
            ''', status, progress, current_step, completed_steps, job_id)

    async def add_log(self, job_id: str, level: str, message: str) -> None:
        log_entry = json.dumps([{
            "level": level,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }])
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET logs = logs || $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            ''', log_entry, job_id)

    async def add_error(self, job_id: str, step: str, reason: str) -> None:
        error_entry = json.dumps([{"step": step, "reason": reason}])
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET errors = errors || $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            ''', error_entry, job_id)

    async def set_results(self, job_id: str, results: Any) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET results = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            ''', json.dumps(results), job_id)

    async def set_completed(self, job_id: str) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET status = 'ready', progress = 100, updated_at = CURRENT_TIMESTAMP WHERE id = $1
            ''', job_id)

    async def set_error(self, job_id: str) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb_jobs SET status = 'error', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            ''', job_id)

    def _row_to_job(self, row) -> Job:
        return Job(
            id=str(row['id']),
            kb_id=str(row['kb_id']),
            status=row['status'],
            progress=row['progress'],
            current_step=row['current_step'],
            total_steps=row['total_steps'],
            completed_steps=row['completed_steps'],
            estimated_time=row['estimated_time'],
            logs=row['logs'] or [],
            results=row['results'],
            errors=row['errors'] or [],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
