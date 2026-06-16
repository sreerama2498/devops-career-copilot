from __future__ import annotations
import json,logging,os
from datetime import datetime,timezone
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
def _mock_score(job,profile):
    job_skills=[s.lower() for s in _to_list(job.get("required_skills"))]
    profile_skills=[s.lower() for s in _to_list(profile.get("skills"))]
    matched=[s for s in profile_skills if any(s in js or js in s for js in job_skills)]
    gaps=[s for s in job_skills if not any(s in ps or ps in s for ps in profile_skills)]
    total=len(job_skills) if job_skills else 1
    sm=round(len(matched)/total*100,1)
    ov=round((sm*0.6)+40,1)
    at=round((sm*0.5)+45,1)
    return {"overall_score":min(ov,99.0),"ats_score":min(at,99.0),"skills_match":sm,"matched_skills":matched,"skill_gaps":gaps[:5],"ai_summary":f"Matched {len(matched)} of {len(job_skills)} skills. Gaps: {chr(44).join(gaps[:3]) or "none"}."}
async def score_job(db,job_id,profile_id):
    j=dict((await db.execute(text("SELECT id,title,company,required_skills,description FROM jobs WHERE id=:id"),{"id":job_id})).mappings().first() or {})
    if not j: raise ValueError(f"Job {job_id} not found")
    p=dict((await db.execute(text("SELECT id,title,skills,years_experience FROM candidate_profiles WHERE id=:id"),{"id":profile_id})).mappings().first() or {})
    if not p: raise ValueError(f"Profile {profile_id} not found")
    result=_mock_score(j,p)
    await db.execute(text("INSERT INTO job_scores (job_id,profile_id,overall_score,ats_score,skills_match,matched_skills,skill_gaps,ai_summary,scored_at) VALUES (:jid,:pid,:ov,:at,:sm,:matched,:gaps,:summary,:now) ON CONFLICT (job_id,profile_id) DO UPDATE SET overall_score=EXCLUDED.overall_score,ats_score=EXCLUDED.ats_score,skills_match=EXCLUDED.skills_match,matched_skills=EXCLUDED.matched_skills,skill_gaps=EXCLUDED.skill_gaps,ai_summary=EXCLUDED.ai_summary,scored_at=EXCLUDED.scored_at"),{"jid":job_id,"pid":profile_id,"ov":result["overall_score"],"at":result["ats_score"],"sm":result["skills_match"],"matched":result["matched_skills"],"gaps":result["skill_gaps"],"summary":result["ai_summary"],"now":datetime.now(timezone.utc)})
    await db.commit()
    logger.info("Scored job %s overall=%.1f",job_id,result["overall_score"])
    return result
