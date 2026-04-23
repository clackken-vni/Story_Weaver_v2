from fastapi import APIRouter, HTTPException
from typing import List
from app.database import db
from app.repositories.document_repo import DocumentRepository
from app.models.document import Document, DocumentCreate, DocumentUpdate

router = APIRouter(prefix="/api/v1/kb/{kb_id}/documents", tags=["documents"])


@router.post("/", response_model=Document)
async def create_document(kb_id: str, data: DocumentCreate):
    repo = DocumentRepository(db)
    return await repo.create(kb_id, data)


@router.get("/", response_model=List[Document])
async def list_documents(kb_id: str):
    repo = DocumentRepository(db)
    return await repo.list_by_kb(kb_id)


@router.patch("/{doc_id}", response_model=Document)
async def update_document(kb_id: str, doc_id: str, data: DocumentUpdate):
    repo = DocumentRepository(db)
    doc = await repo.update(doc_id, data)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}")
async def delete_document(kb_id: str, doc_id: str):
    repo = DocumentRepository(db)
    success = await repo.delete(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}
