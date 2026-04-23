import pytest
from app.database import Database


@pytest.mark.asyncio
async def test_database_connect():
    db = Database()
    await db.connect()
    assert db.pool is not None
    await db.disconnect()


@pytest.mark.asyncio
async def test_database_init_schema():
    db = Database()
    await db.connect()
    await db.init_schema()
    async with db.pool.acquire() as conn:
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        table_names = [t['table_name'] for t in tables]
        assert 'kb' in table_names
        assert 'kb_documents' in table_names
        assert 'kb_jobs' in table_names
        assert 'kb_project_mapping' in table_names
    await db.disconnect()
