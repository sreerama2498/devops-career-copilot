from datetime import date, datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_stats(profile_id: UUID | None = Query(None), db: AsyncSession = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    jobs_today = (await db.execute(
        text("SELECT COUNT(*) FROM jobs WHERE collected_at >= :ts"),
        {"ts": today_start}
    )).scalar() or 0

    avg_score = 0.0
    if profile_id:
        avg_score = float((await db.execute(
            text("SELECT AVG(overall_score) FROM job_scores WHERE profile_id=:pid"),
            {"pid": str(profile_id)}
        )).scalar() or 0)

    active_apps = (await db.execute(
        text("SELECT COUNT(*) FROM applications WHERE user_id=:uid AND status IN ('applied','screening','interview','offer')"),
        {"uid": "c828ce5d-68dd-416a-afd3-f4d427f6911e"}
    )).scalar() or 0

    interviews = (await db.execute(
        text("SELECT COUNT(*) FROM applications WHERE user_id=:uid AND status='interview'"),
        {"uid": "c828ce5d-68dd-416a-afd3-f4d427f6911e"}
    )).scalar() or 0

    rows = await db.execute(
        text("SELECT status, COUNT(*) FROM applications WHERE user_id=:uid GROUP BY status"),
        {"uid": "c828ce5d-68dd-416a-afd3-f4d427f6911e"}
    )
    by_status = {str(r[0]): r[1] for r in rows}

    return DashboardStats(
        jobs_collected_today=jobs_today,
        avg_match_score=round(avg_score, 1),
        active_applications=active_apps,
        interviews_scheduled=interviews,
        applications_by_status=by_status
    )
