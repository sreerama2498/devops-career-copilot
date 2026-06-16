from uuid import UUID
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.scoring import score_job
router=APIRouter(prefix="/score",tags=["score"])
MOCK_PROFILE_ID="c828ce5d-68dd-416a-afd3-f4d427f6911e"
class ScoreRequest(BaseModel):
    job_id:UUID
    profile_id:UUID|None=None
class BatchScoreRequest(BaseModel):
    profile_id:UUID|None=None
    limit:int=50
class ScoreResponse(BaseModel):
    job_id:str;profile_id:str;overall_score:float;ats_score:float
    skills_match:float;matched_skills:list[str];skill_gaps:list[str];ai_summary:str
@router.post("/",response_model=ScoreResponse)
async def score_single(payload:ScoreRequest,db:AsyncSession=Depends(get_db)):
    pid=str(payload.profile_id or MOCK_PROFILE_ID)
    try:
        result=await score_job(db,str(payload.job_id),pid)
    except ValueError as e:
        raise HTTPException(status_code=404,detail=str(e))
    return ScoreResponse(job_id=str(payload.job_id),profile_id=pid,**result)
@router.post("/batch")
async def score_batch(payload:BatchScoreRequest,db:AsyncSession=Depends(get_db)):
    pid=str(payload.profile_id or MOCK_PROFILE_ID)
    rows=await db.execute(text("SELECT j.id FROM jobs j LEFT JOIN job_scores s ON s.job_id=j.id AND s.profile_id=:pid WHERE j.is_active=true AND s.id IS NULL LIMIT :lim"),{"pid":pid,"lim":payload.limit})
    job_ids=[str(r[0]) for r in rows]
    if not job_ids: return {"scored":0,"message":"No unscored jobs found"}
    scored=errors=0
    for jid in job_ids:
        try:
            await score_job(db,jid,pid); scored+=1
        except Exception as e:
            errors+=1
    return {"scored":scored,"errors":errors,"total":len(job_ids),"profile_id":pid}
@router.get("/stats")
async def score_stats(db:AsyncSession=Depends(get_db)):
    row=await db.execute(text("SELECT COUNT(*) as total,AVG(overall_score) as avg_score,MAX(overall_score) as max_score,MIN(overall_score) as min_score FROM job_scores WHERE profile_id=:pid"),{"pid":MOCK_PROFILE_ID})
    stats=dict(row.mappings().first() or {})
    return {k:round(float(v),1) if v else 0 for k,v in stats.items()}
