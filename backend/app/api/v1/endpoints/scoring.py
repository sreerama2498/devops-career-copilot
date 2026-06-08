from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.scoring import score_job, score_all_jobs

router = APIRouter(prefix="/scoring", tags=["scoring"])

@router.post("/job/{job_id}")
async def score_single_job(
    job_id: UUID,
    profile_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    try:
        score = await score_job(db, job_id, profile_id)
        return {
            "job_id": str(job_id),
            "profile_id": str(profile_id),
            "overall_score": float(score.overall_score or 0),
            "ats_score": float(score.ats_score or 0),
            "skills_match": float(score.skills_match or 0),
            "matched_skills": score.matched_skills,
            "skill_gaps": score.skill_gaps,
            "ai_summary": score.ai_summary
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")


@router.post("/batch")
async def score_batch(
    profile_id: UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await score_all_jobs(db, profile_id, limit)
    return result
