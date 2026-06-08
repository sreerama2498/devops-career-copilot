from datetime import date, datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Application, ApplicationStatus, Job, JobScore
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

@router.get("/stats", response_model=DashboardStats)
async def get_stats(profile_id: UUID | None = Query(None), db: AsyncSession = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    jobs_today = await db.scalar(select(func.count(Job.id)).where(Job.collected_at >= today_start)) or 0
    avg_score = 0.0
    if profile_id:
        avg_score = float(await db.scalar(select(func.avg(JobScore.overall_score)).where(JobScore.profile_id == profile_id)) or 0)
    active_apps = await db.scalar(select(func.count(Application.id)).where(Application.user_id == MOCK_USER_ID, Application.status.in_(["applied","screening","interview","offer"]))) or 0
    interviews = await db.scalar(select(func.count(Application.id)).where(Application.user_id == MOCK_USER_ID, Application.status == ApplicationStatus.interview)) or 0
    rows = await db.execute(select(Application.status, func.count(Application.id)).where(Application.user_id == MOCK_USER_ID).group_by(Application.status))
    return DashboardStats(jobs_collected_today=jobs_today, avg_match_score=round(avg_score,1), active_applications=active_apps, interviews_scheduled=interviews, applications_by_status={str(r[0]): r[1] for r in rows})
