from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class KBCreate(BaseModel):
    name: str
    description: Optional[str] = None
    genres: List[str] = []
    created_by: str


class KBUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    genres: Optional[List[str]] = None


class KB(BaseModel):
    id: str
    name: str
    description: Optional[str]
    genres: List[str]
    created_by: str
    status: str
    document_count: int
    created_at: datetime
    updated_at: datetime
