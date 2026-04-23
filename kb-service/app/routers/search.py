from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel
from app.database import db
from app.repositories.document_repo import DocumentRepository
from app.models.document import Document

router = APIRouter(prefix="/api/v1/kb/{kb_id}/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    tags: Optional[List[str]] = None


@router.post("/", response_model=List[Document])
async def search_documents(kb_id: str, data: SearchRequest):
    repo = DocumentRepository(db)
    return await repo.search(kb_id, data.query, data.tags)
