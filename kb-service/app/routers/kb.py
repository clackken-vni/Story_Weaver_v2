from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.database import db
from app.repositories.kb_repo import KBRepository
from app.models.kb import KB, KBCreate, KBUpdate
from app.services.collection_pipeline import CollectionPipeline

router = APIRouter(prefix="/api/v1/kb", tags=["kb"])


@router.post("/", response_model=KB)
async def create_kb(data: KBCreate, background_tasks: BackgroundTasks):
    repo = KBRepository(db)
    kb = await repo.create(data)

    pipeline = CollectionPipeline(db)
    background_tasks.add_task(pipeline.run, kb.id, kb.name, kb.genres)

    return kb


@router.get("/", response_model=List[KB])
async def list_kbs():
    repo = KBRepository(db)
    return await repo.list_all()


@router.get("/{kb_id}", response_model=KB)
async def get_kb(kb_id: str):
    repo = KBRepository(db)
    kb = await repo.get_by_id(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="KB not found")
    return kb


@router.patch("/{kb_id}", response_model=KB)
async def update_kb(kb_id: str, data: KBUpdate):
    repo = KBRepository(db)
    kb = await repo.update(kb_id, data)
    if not kb:
        raise HTTPException(status_code=404, detail="KB not found")
    return kb


@router.delete("/{kb_id}")
async def delete_kb(kb_id: str):
    repo = KBRepository(db)
    success = await repo.delete(kb_id)
    if not success:
        raise HTTPException(status_code=404, detail="KB not found")
    return {"message": "KB deleted"}
