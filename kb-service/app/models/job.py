from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class JobCreate(BaseModel):
    kb_id: str
    total_steps: int = 0


class Job(BaseModel):
    id: str
    kb_id: str
    status: str
    progress: int
    current_step: Optional[str]
    total_steps: int
    completed_steps: int
    estimated_time: Optional[str]
    logs: List[Any]
    results: Optional[Any]
    errors: List[Any]
    created_at: datetime
    updated_at: datetime
