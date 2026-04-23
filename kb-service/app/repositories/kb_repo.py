from typing import List, Optional
from app.database import Database
from app.models.kb import KB, KBCreate, KBUpdate


class KBRepository:
    def __init__(self, db: Database):
        self.db = db

    async def create(self, data: KBCreate) -> KB:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('''
                INSERT INTO kb (name, description, genres, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            ''', data.name, data.description, data.genres, data.created_by)
            return self._row_to_kb(row)

    async def get_by_id(self, kb_id: str) -> Optional[KB]:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM kb WHERE id = $1', kb_id)
            return self._row_to_kb(row) if row else None

    async def list_all(self) -> List[KB]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM kb ORDER BY created_at DESC')
            return [self._row_to_kb(row) for row in rows]

    async def update(self, kb_id: str, data: KBUpdate) -> Optional[KB]:
        async with self.db.pool.acquire() as conn:
            fields = []
            values = []
            idx = 1

            if data.name is not None:
                fields.append(f"name = ${idx}")
                values.append(data.name)
                idx += 1
            if data.description is not None:
                fields.append(f"description = ${idx}")
                values.append(data.description)
                idx += 1
            if data.genres is not None:
                fields.append(f"genres = ${idx}")
                values.append(data.genres)
                idx += 1

            if not fields:
                return await self.get_by_id(kb_id)

            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(kb_id)

            row = await conn.fetchrow(f'''
                UPDATE kb SET {', '.join(fields)} WHERE id = ${idx} RETURNING *
            ''', *values)
            return self._row_to_kb(row) if row else None

    async def update_status(self, kb_id: str, status: str) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            ''', status, kb_id)

    async def update_document_count(self, kb_id: str) -> None:
        async with self.db.pool.acquire() as conn:
            await conn.execute('''
                UPDATE kb SET document_count = (
                    SELECT COUNT(*) FROM kb_documents WHERE kb_id = $1 AND verified = TRUE
                ), updated_at = CURRENT_TIMESTAMP WHERE id = $1
            ''', kb_id)

    async def delete(self, kb_id: str) -> bool:
        async with self.db.pool.acquire() as conn:
            result = await conn.execute('DELETE FROM kb WHERE id = $1', kb_id)
            return result == 'DELETE 1'

    def _row_to_kb(self, row) -> KB:
        return KB(
            id=str(row['id']),
            name=row['name'],
            description=row['description'],
            genres=row['genres'] or [],
            created_by=str(row['created_by']),
            status=row['status'],
            document_count=row['document_count'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
