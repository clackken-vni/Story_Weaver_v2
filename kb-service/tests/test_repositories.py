import pytest
from app.database import Database
from app.repositories.kb_repo import KBRepository
from app.models.kb import KBCreate


@pytest.mark.asyncio
async def test_kb_repo_create():
    db = Database()
    await db.connect()
    await db.init_schema()

    repo = KBRepository(db)
    kb = await repo.create(KBCreate(
        name="Test KB",
        description="Test description",
        genres=["lịch sử"],
        created_by="test-user-id"
    ))

    assert kb.name == "Test KB"
    assert kb.status == "pending"
    assert kb.document_count == 0

    await db.disconnect()


@pytest.mark.asyncio
async def test_kb_repo_get_by_id():
    db = Database()
    await db.connect()
    await db.init_schema()

    repo = KBRepository(db)
    kb = await repo.create(KBCreate(
        name="Test KB",
        created_by="test-user-id"
    ))

    retrieved = await repo.get_by_id(kb.id)
    assert retrieved is not None
    assert retrieved.name == "Test KB"

    await db.disconnect()


@pytest.mark.asyncio
async def test_kb_repo_list_all():
    db = Database()
    await db.connect()
    await db.init_schema()

    repo = KBRepository(db)
    await repo.create(KBCreate(name="KB 1", created_by="user1"))
    await repo.create(KBCreate(name="KB 2", created_by="user2"))

    kbs = await repo.list_all()
    assert len(kbs) >= 2

    await db.disconnect()
