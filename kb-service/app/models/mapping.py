from pydantic import BaseModel
from typing import List
from datetime import datetime


class KBProjectMapping(BaseModel):
    id: str
    kb_id: str
    project_id: str
    created_at: datetime


class MappingCreate(BaseModel):
    kb_id: str
    project_id: str
