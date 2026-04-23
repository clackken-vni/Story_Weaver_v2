from fastapi import APIRouter, HTTPException
from typing import List
from app.database import db
from app.repositories.mapping_repo import MappingRepository

router = APIRouter(prefix="/api/v1/kb/project", tags=["mapping"])


@router.get("/{project_id}")
async def get_project_kbs(project_id: str):
    repo = MappingRepository(db)
    return await repo.get_kbs_by_project(project_id)


@router.post("/{project_id}")
async def map_kbs_to_project(project_id: str, kb_ids: List[str]):
    repo = MappingRepository(db)
    return await repo.map_kbs(project_id, kb_ids)


@router.delete("/{project_id}/{kb_id}")
async def unmap_kb(project_id: str, kb_id: str):
    repo = MappingRepository(db)
    success = await repo.unmap_kb(project_id, kb_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return {"message": "KB unmapped"}
