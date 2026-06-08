from __future__ import annotations
import json, logging
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Job, JobScore, CandidateProfile
from app.core.config import get_settings
import httpx

logger = logging.getLogger(__name__)

async def score_job(db: AsyncSession, job_id: UUID, profile_id: UUID) -> JobScore:
    job = await db.get(Job, job_id)
    profile = await db.get(CandidateProfile, profile_id)
    if not job or not profile:
        raise ValueError("Job or profile not found")

    existing = await db.scalar(
        select(JobScore).where(
            JobScore.job_id == job_id,
            JobScore.profile_id == profile_id
        )
    )
    if existing:
        return existing

    settings = get_settings()
    prompt = f"""
You are an expert technical recruiter and ATS system.
Score this job against the candidate profile. Respond ONLY with valid JSON, no other text.

CANDIDATE PROFILE:
- Title: {profile.title}
- Years Experience: {profile.years_experience}
- Skills: {', '.join(profile.skills or [])}
- Resume: {(profile.resume_text or '')[:1000]}

JOB:
- Title: {job.title}
- Company: {job.company}
- Required Skills: {', '.join(job.required_skills or [])}
- Description: {(job.description or '')[:1000]}

Respond with this exact JSON structure:
{{
  "overall_score": <float 0-100>,
  "ats_score": <float 0-100>,
  "skills_match": <float 0-100>,
  "matched_skills": [<list of matching skills>],
  "skill_gaps": [<list of missing skills>],
  "ai_summary": "<2-3 sentence summary of fit>"
}}
"""

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        resp.raise_for_status()
        data = resp.json()

    result = json.loads(data["content"][0]["text"])

    score = JobScore(
        job_id=job_id,
        profile_id=profile_id,
        overall_score=result.get("overall_score"),
        ats_score=result.get("ats_score"),
        skills_match=result.get("skills_match"),
        matched_skills=result.get("matched_skills", []),
        skill_gaps=result.get("skill_gaps", []),
        ai_summary=result.get("ai_summary")
    )
    db.add(score)
    await db.commit()
    await db.refresh(score)
    return score


async def score_all_jobs(db: AsyncSession, profile_id: UUID, limit: int = 50) -> dict:
    already_scored = (await db.scalars(
        select(JobScore.job_id).where(JobScore.profile_id == profile_id)
    )).all()

    jobs = (await db.scalars(
        select(Job).where(
            Job.is_active == True,
            Job.id.not_in(already_scored) if already_scored else True
        ).limit(limit)
    )).all()

    scored, failed = 0, 0
    for job in jobs:
        try:
            await score_job(db, job.id, profile_id)
            scored += 1
        except Exception as e:
            logger.warning("Failed to score job %s: %s", job.id, e)
            failed += 1

    return {"scored": scored, "failed": failed, "total": len(jobs)}
