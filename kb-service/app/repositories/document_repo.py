from typing import List, Optional
from app.database import Database
from app.models.document import Document, DocumentCreate, DocumentUpdate


class DocumentRepository:
    def __init__(self, db: Database):
        self.db = db

    async def create(self, kb_id: str, data: DocumentCreate) -> Document:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('''
                INSERT INTO kb_documents (kb_id, title, content, tags, trust_score, verified, source_urls)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            ''', kb_id, data.title, data.content, data.tags, data.trust_score, data.verified, data.source_urls)
            return self._row_to_document(row)

    async def get_by_id(self, doc_id: str) -> Optional[Document]:
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM kb_documents WHERE id = $1', doc_id)
            return self._row_to_document(row) if row else None

    async def list_by_kb(self, kb_id: str) -> List[Document]:
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM kb_documents WHERE kb_id = $1 ORDER BY created_at DESC', kb_id)
            return [self._row_to_document(row) for row in rows]

    async def update(self, doc_id: str, data: DocumentUpdate) -> Optional[Document]:
        async with self.db.pool.acquire() as conn:
            fields = []
            values = []
            idx = 1

            if data.title is not None:
                fields.append(f"title = ${idx}")
                values.append(data.title)
                idx += 1
            if data.content is not None:
                fields.append(f"content = ${idx}")
                values.append(data.content)
                idx += 1
            if data.tags is not None:
                fields.append(f"tags = ${idx}")
                values.append(data.tags)
                idx += 1

            if not fields:
                return await self.get_by_id(doc_id)

            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(doc_id)

            row = await conn.fetchrow(f'''
                UPDATE kb_documents SET {', '.join(fields)} WHERE id = ${idx} RETURNING *
            ''', *values)
            return self._row_to_document(row) if row else None

    async def delete(self, doc_id: str) -> bool:
        async with self.db.pool.acquire() as conn:
            result = await conn.execute('DELETE FROM kb_documents WHERE id = $1', doc_id)
            return result == 'DELETE 1'

    async def search(self, kb_id: str, query: str, tags: List[str] = None) -> List[Document]:
        async with self.db.pool.acquire() as conn:
            conditions = ["kb_id = $1"]
            params = [kb_id]
            idx = 2

            if query:
                conditions.append(f"(title ILIKE ${idx} OR content ILIKE ${idx})")
                params.append(f"%{query}%")
                idx += 1

            if tags:
                conditions.append(f"tags && ${idx}")
                params.append(tags)
                idx += 1

            rows = await conn.fetch(f'''
                SELECT * FROM kb_documents
                WHERE {' AND '.join(conditions)}
                ORDER BY trust_score DESC
            ''', *params)
            return [self._row_to_document(row) for row in rows]

    def _row_to_document(self, row) -> Document:
        return Document(
            id=str(row['id']),
            kb_id=str(row['kb_id']),
            title=row['title'],
            content=row['content'],
            tags=row['tags'] or [],
            trust_score=row['trust_score'],
            verified=row['verified'],
            source_urls=row['source_urls'] or [],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
