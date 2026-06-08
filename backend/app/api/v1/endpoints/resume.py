from __future__ import annotations
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Job, CandidateProfile
from app.core.config import get_settings
from pydantic import BaseModel
import httpx, json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["resume"])

MOCK_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

class ResumeRequest(BaseModel):
    job_id: UUID

class ResumeResponse(BaseModel):
    job_title: str
    company: str
    resume_text: str
    cover_letter: str
    keywords: list[str]

@router.post("/generate", response_model=ResumeResponse)
async def generate_resume(payload: ResumeRequest, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    from sqlalchemy import select
    profile = await db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == MOCK_PROFILE_ID))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found — create your profile first")

    settings = get_settings()
    prompt = f"""
You are an expert resume writer specializing in DevOps, SRE, and Cloud Engineering roles.
Generate a tailored resume and cover letter for this candidate applying to this job.
Respond ONLY with valid JSON, no other text.

CANDIDATE PROFILE:
- Name: Karthik S
- Title: {profile.title}
- Years Experience: {profile.years_experience}
- Location: {profile.location}
- Skills: {", ".join(profile.skills or [])}
- Bio/Resume: {(profile.resume_text or "")[:2000]}
- Salary expectation: ${profile.salary_min or 0:,} - ${profile.salary_max or 0:,}

JOB:
- Title: {job.title}
- Company: {job.company}
- Location: {job.location}
- Required Skills: {", ".join(job.required_skills or [])}
- Description: {(job.description or "")[:1500]}

Respond with this exact JSON:
{{
  "resume_text": "<full tailored resume in plain text, ATS optimized, with sections: Summary, Skills, Experience, Education>",
  "cover_letter": "<professional cover letter 3-4 paragraphs>",
  "keywords": [<list of 8-12 ATS keywords from the job description that are included>]
}}
"""

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 4000,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        if not resp.is_success:
            raise HTTPException(status_code=500, detail=f"Anthropic error: {resp.text}")
        data = resp.json()

    try:
        result = json.loads(data["content"][0]["text"])
    except Exception:
        raise HTTPException(status_code=500, detail="AI response parsing failed")

    return ResumeResponse(
        job_title=job.title,
        company=job.company,
        resume_text=result.get("resume_text", ""),
        cover_letter=result.get("cover_letter", ""),
        keywords=result.get("keywords", [])
    )
