from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Job, JobScore
from app.schemas.schemas import JobWithScore

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/", response_model=list[JobWithScore])
async def list_jobs(
    profile_id: Optional[UUID] = Query(None),
    source: Optional[str] = Query(None),
    remote_only: bool = Query(False),
    min_score: Optional[float] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    q = select(Job).where(Job.is_active == True)
    if source: q = q.where(Job.source == source)
    if remote_only: q = q.where(Job.is_remote == True)
    q = q.order_by(desc(Job.collected_at)).limit(limit).offset(offset)
    jobs = (await db.scalars(q)).all()
    if not profile_id: return jobs
    job_ids = [j.id for j in jobs]
    scores = {s.job_id: s for s in (await db.scalars(select(JobScore).where(JobScore.profile_id == profile_id, JobScore.job_id.in_(job_ids)))).all()}
    result = []
    for job in jobs:
        score = scores.get(job.id)
        item = JobWithScore.model_validate(job)
        if score:
            item.overall_score = float(score.overall_score or 0)
            item.ats_score = float(score.ats_score or 0)
            item.skill_gaps = score.skill_gaps or []
            item.matched_skills = score.matched_skills or []
            item.ai_summary = score.ai_summary
        if min_score and (item.overall_score or 0) < min_score: continue
        result.append(item)
    return result

@router.get("/{job_id}", response_model=JobWithScore)
async def get_job(job_id: UUID, profile_id: Optional[UUID] = Query(None), db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    item = JobWithScore.model_validate(job)
    if profile_id:
        score = await db.scalar(select(JobScore).where(JobScore.job_id == job_id, JobScore.profile_id == profile_id))
        if score:
            item.overall_score = float(score.overall_score or 0)
            item.ats_score = float(score.ats_score or 0)
            item.skill_gaps = score.skill_gaps or []; item.matched_skills = score.matched_skills or []
            item.ai_summary = score.ai_summary
    return item
