from fastapi import APIRouter
from app.api.v1.endpoints import auth,jobs,applications,profile,dashboard,ingest,score,analytics
router=APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(jobs.router)
router.include_router(applications.router)
router.include_router(profile.router)
router.include_router(dashboard.router)
router.include_router(ingest.router)
router.include_router(score.router)
router.include_router(analytics.router)
