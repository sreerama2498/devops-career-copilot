from fastapi import APIRouter
from app.api.v1.endpoints import auth, jobs, applications, profile, dashboard, ingest, scoring, resume

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(jobs.router)
router.include_router(applications.router)
router.include_router(profile.router)
router.include_router(dashboard.router)
router.include_router(ingest.router)
router.include_router(scoring.router)
router.include_router(resume.router)
