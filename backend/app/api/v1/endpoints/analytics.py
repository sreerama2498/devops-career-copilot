from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.schemas import AnalyticsOverview, ScoreTrendPoint, SourcePerformance, FunnelStage

router = APIRouter(prefix="/analytics", tags=["analytics"])

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"
PIPELINE_ORDER = ["saved", "applied", "screening", "interview", "offer"]
DROPPED_ORDER = ["rejected", "withdrawn"]


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    profile_id: UUID | None = Query(None),
    days: int = Query(30, le=365),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    score_trends = []
    if profile_id:
        rows = (await db.execute(
            text("""
                SELECT date_trunc('day', scored_at) AS day,
                       AVG(overall_score) AS avg_score,
                       COUNT(*) AS jobs_scored
                FROM job_scores
                WHERE profile_id = :pid AND scored_at >= :since
                GROUP BY day
                ORDER BY day
            """),
            {"pid": str(profile_id), "since": since},
        )).mappings().all()
        score_trends = [
            ScoreTrendPoint(
                date=r["day"].strftime("%Y-%m-%d"),
                avg_score=round(float(r["avg_score"] or 0), 1),
                jobs_scored=r["jobs_scored"],
            )
            for r in rows
        ]

    rows = (await db.execute(
        text("""
            SELECT j.source AS source,
                   COUNT(DISTINCT j.id) AS jobs_collected,
                   COALESCE(AVG(s.overall_score), 0) AS avg_score,
                   COUNT(DISTINCT a.id) AS applications
            FROM jobs j
            LEFT JOIN job_scores s ON s.job_id = j.id AND s.profile_id = :pid
            LEFT JOIN applications a ON a.job_id = j.id AND a.user_id = :uid
            GROUP BY j.source
            ORDER BY jobs_collected DESC
        """),
        {"pid": str(profile_id) if profile_id else None, "uid": MOCK_USER_ID},
    )).mappings().all()
    source_performance = [
        SourcePerformance(
            source=str(r["source"]),
            jobs_collected=r["jobs_collected"],
            avg_score=round(float(r["avg_score"] or 0), 1),
            applications=r["applications"],
            conversion_rate=round((r["applications"] / r["jobs_collected"] * 100), 1) if r["jobs_collected"] else 0.0,
        )
        for r in rows
    ]

    rows = (await db.execute(
        text("SELECT status, COUNT(*) AS count FROM applications WHERE user_id = :uid GROUP BY status"),
        {"uid": MOCK_USER_ID},
    )).mappings().all()
    counts = {str(r["status"]): r["count"] for r in rows}
    funnel = [FunnelStage(status=stage, count=counts.get(stage, 0)) for stage in PIPELINE_ORDER]
    dropped = [FunnelStage(status=stage, count=counts.get(stage, 0)) for stage in DROPPED_ORDER]

    return AnalyticsOverview(
        score_trends=score_trends,
        source_performance=source_performance,
        funnel=funnel,
        dropped=dropped,
    )
