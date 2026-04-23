from typing import List
from app.database import Database
from app.models.mapping import KBProjectMapping


class MappingRepository:
    def __init__(self, db: Database):
        self.db = db

    async def map_kbs(self, project_id: str, kb_ids: List[str]) -> List[KBProjectMapping]:
        async with self.db.pool.acquire() as conn:
            results = []
            for kb_id in kb_ids:
                row = await conn.fetchrow('''
                    INSERT INTO kb_project_mapping (kb_id, project_id)
                    VALUES ($1, $2)
                    ON CONFLICT (kb_id, project_id) DO NOTHING
                    RETURNING *
                ''', kb_id, project_id)
                if row:
                    results.append(self._row_to_mapping(row))
            return results

    async def get_kbs_by_project(self, project_id: str) -> List[KBProjectMapping]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM kb_project_mapping WHERE project_id = $1 ORDER BY created_at DESC',
                project_id
            )
            return [self._row_to_mapping(row) for row in rows]

    async def get_projects_by_kb(self, kb_id: str) -> List[KBProjectMapping]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM kb_project_mapping WHERE kb_id = $1 ORDER BY created_at DESC',
                kb_id
            )
            return [self._row_to_mapping(row) for row in rows]

    async def unmap_kb(self, project_id: str, kb_id: str) -> bool:
        async with self.db.pool.acquire() as conn:
            result = await conn.execute(
                'DELETE FROM kb_project_mapping WHERE project_id = $1 AND kb_id = $2',
                project_id, kb_id
            )
            return result == 'DELETE 1'

    def _row_to_mapping(self, row) -> KBProjectMapping:
        return KBProjectMapping(
            id=str(row['id']),
            kb_id=str(row['kb_id']),
            project_id=str(row['project_id']),
            created_at=row['created_at']
        )
