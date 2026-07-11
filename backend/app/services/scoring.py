from __future__ import annotations
import json,logging,os,re
from datetime import datetime,timezone
import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
logger=logging.getLogger(__name__)
ANTHROPIC_API_KEY=os.getenv("ANTHROPIC_API_KEY","")
MODEL=os.getenv("ANTHROPIC_MODEL","claude-haiku-4-5")

def _to_list(v):
    if v is None: return []
    if isinstance(v,list): return v
    if isinstance(v,str): return [x.strip() for x in v.split(",") if x.strip()]
    try: return list(v)
    except: return []

_YEARS_RE = re.compile(
    r"(\d{1,2})\s*(?:\+|-\s*\d{1,2})?\s*\+?\s*years?", re.IGNORECASE
)

def extract_min_years(description: str | None) -> int | None:
    """Best-effort extraction of a minimum years-of-experience requirement
    from free-text job descriptions (e.g. '5+ years', '3-5 years experience').
    Returns None when nothing plausible is found -- callers should treat
    that as 'unknown', not zero."""
    if not description:
        return None
    matches = [int(m.group(1)) for m in _YEARS_RE.finditer(description)]
    # Sanity bound: ignore absurd matches (e.g. "24/7", years like "2024")
    plausible = [m for m in matches if 0 < m <= 20]
    return min(plausible) if plausible else None

def score_experience_alignment(profile_years, job_min_years: int | None) -> int:
    """0-100: how well candidate years-of-experience aligns with the job's
    (best-effort parsed) minimum requirement. Unknown requirement -> neutral."""
    if job_min_years is None:
        return 50
    try:
        profile_years = int(profile_years)
    except (TypeError, ValueError):
        return 50
    diff = profile_years - job_min_years
    if diff >= 0:
        return 100
    if diff >= -1:
        return 70
    if diff >= -3:
        return 40
    return 15

def score_remote_match(remote_preference: str | None, job_is_remote: bool) -> int:
    """0-100: candidate's stated remote preference vs. the job's remote flag."""
    pref = (remote_preference or "").strip().lower()
    if not pref or pref in ("any", "flexible", "no preference"):
        return 100
    if pref == "remote":
        return 100 if job_is_remote else 20
    if pref in ("onsite", "on-site", "in-office"):
        return 100 if not job_is_remote else 40
    if pref == "hybrid":
        return 75  # hybrid candidates tolerate either reasonably well
    return 50

def _mock_score(job,profile,experience_score=50,remote_score=50):
    """Heuristic fallback used only when no ANTHROPIC_API_KEY is configured."""
    job_skills=[s.lower() for s in _to_list(job.get("required_skills"))]
    profile_skills=[s.lower() for s in _to_list(profile.get("skills"))]
    matched=[s for s in profile_skills if any(s in js or js in s for js in job_skills)]
    gaps=[s for s in job_skills if not any(s in ps or ps in s for ps in profile_skills)]
    total=len(job_skills) if job_skills else 1
    sm=round(len(matched)/total*100,1)
    # Blend skill match with experience/remote alignment rather than skills alone.
    ov=round((sm*0.5)+(experience_score*0.2)+(remote_score*0.1)+20,1)
    at=round((sm*0.5)+45,1)
    return {"overall_score":min(ov,99.0),"ats_score":min(at,99.0),"skills_match":sm,"matched_skills":matched,"skill_gaps":gaps[:5],"ai_summary":f"Matched {len(matched)} of {len(job_skills)} skills. Gaps: {chr(44).join(gaps[:3]) or 'none'}. (heuristic fallback — no ANTHROPIC_API_KEY configured)"}

async def _ai_score(job,profile,experience_score,remote_score,job_min_years):
    """Real AI-based scoring via the Anthropic Messages API."""
    years_line = f"{job_min_years}+ years (parsed from description)" if job_min_years is not None else "not specified"
    prompt = f"""You are an expert technical recruiter scoring how well a DevOps/SRE/Platform candidate matches a job.
Respond ONLY with valid JSON, no other text, no markdown fences.

CANDIDATE:
- Title: {profile.get("title","")}
- Years experience: {profile.get("years_experience","")}
- Remote preference: {profile.get("remote_preference","") or "not specified"}
- Skills: {", ".join(_to_list(profile.get("skills")))}

JOB:
- Title: {job.get("title","")}
- Company: {job.get("company","")}
- Required skills: {", ".join(_to_list(job.get("required_skills")))}
- Remote: {"yes" if job.get("is_remote") else "no"}
- Minimum years required: {years_line}
- Description: {(job.get("description") or "")[:1500]}

PRE-COMPUTED SIGNALS (already calculated, use as grounding -- don't recompute):
- Experience alignment score: {experience_score}/100
- Remote preference match score: {remote_score}/100

Respond with this exact JSON shape:
{{
  "overall_score": <0-100 float, overall fit>,
  "ats_score": <0-100 float, likelihood of passing an ATS keyword screen>,
  "skills_match": <0-100 float, percent of required skills the candidate has>,
  "matched_skills": [<skills the candidate has that match the job>],
  "skill_gaps": [<up to 5 required skills the candidate is missing>],
  "ai_summary": "<1-2 sentence explanation of the score>"
}}"""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
    raw = data["content"][0]["text"].strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw[4:] if raw.startswith("json") else raw
    result = json.loads(raw)
    return {
        "overall_score": min(float(result.get("overall_score", 0)), 99.0),
        "ats_score": min(float(result.get("ats_score", 0)), 99.0),
        "skills_match": float(result.get("skills_match", 0)),
        "matched_skills": result.get("matched_skills", []),
        "skill_gaps": result.get("skill_gaps", [])[:5],
        "ai_summary": result.get("ai_summary", ""),
    }

async def score_job(db,job_id,profile_id):
    j=dict((await db.execute(text("SELECT id,title,company,required_skills,description,is_remote FROM jobs WHERE id=:id"),{"id":job_id})).mappings().first() or {})
    if not j: raise ValueError(f"Job {job_id} not found")
    p=dict((await db.execute(text("SELECT id,title,skills,years_experience,remote_preference FROM candidate_profiles WHERE id=:id"),{"id":profile_id})).mappings().first() or {})
    if not p: raise ValueError(f"Profile {profile_id} not found")

    job_min_years = extract_min_years(j.get("description"))
    experience_score = score_experience_alignment(p.get("years_experience"), job_min_years)
    remote_score = score_remote_match(p.get("remote_preference"), bool(j.get("is_remote")))

    if ANTHROPIC_API_KEY:
        try:
            result = await _ai_score(j,p,experience_score,remote_score,job_min_years)
        except Exception as e:
            logger.warning("AI scoring failed for job %s, falling back to heuristic: %s", job_id, e)
            result = _mock_score(j,p,experience_score,remote_score)
    else:
        result = _mock_score(j,p,experience_score,remote_score)

    await db.execute(text("INSERT INTO job_scores (job_id,profile_id,overall_score,ats_score,skills_match,matched_skills,skill_gaps,ai_summary,scored_at) VALUES (:jid,:pid,:ov,:at,:sm,:matched,:gaps,:summary,:now) ON CONFLICT (job_id,profile_id) DO UPDATE SET overall_score=EXCLUDED.overall_score,ats_score=EXCLUDED.ats_score,skills_match=EXCLUDED.skills_match,matched_skills=EXCLUDED.matched_skills,skill_gaps=EXCLUDED.skill_gaps,ai_summary=EXCLUDED.ai_summary,scored_at=EXCLUDED.scored_at"),{"jid":job_id,"pid":profile_id,"ov":result["overall_score"],"at":result["ats_score"],"sm":result["skills_match"],"matched":result["matched_skills"],"gaps":result["skill_gaps"],"summary":result["ai_summary"],"now":datetime.now(timezone.utc)})
    await db.commit()
    logger.info("Scored job %s overall=%.1f",job_id,result["overall_score"])
    return result
