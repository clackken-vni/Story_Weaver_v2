from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    trust_score: float = 0.0
    verified: bool = False
    source_urls: List[str] = []


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class Document(BaseModel):
    id: str
    kb_id: str
    title: str
    content: str
    tags: List[str]
    trust_score: float
    verified: bool
    source_urls: List[str]
    created_at: datetime
    updated_at: datetime
