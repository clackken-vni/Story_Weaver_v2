from fastapi import APIRouter, HTTPException
from typing import List
from app.database import db
from app.repositories.job_repo import JobRepository
from app.models.job import Job

router = APIRouter(prefix="/api/v1/kb/jobs", tags=["jobs"])


@router.get("/", response_model=List[Job])
async def list_jobs():
    repo = JobRepository(db)
    return await repo.list_all()


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    repo = JobRepository(db)
    job = await repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/stream")
async def stream_job_logs(job_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str):
    repo = JobRepository(db)
    job = await repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await repo.update_progress(job_id, "cancelled", job.progress, "Cancelled by user", job.completed_steps)
    return {"message": "Job cancelled"}


@router.post("/{job_id}/retry")
async def retry_job(job_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")
