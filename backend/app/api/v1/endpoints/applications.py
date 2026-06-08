from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Application, Interview
from app.schemas.schemas import ApplicationCreate, ApplicationRead, ApplicationUpdate, InterviewCreate, InterviewRead

router = APIRouter(prefix="/applications", tags=["applications"])
MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

@router.get("/", response_model=list[ApplicationRead])
async def list_applications(status: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Application).where(Application.user_id == MOCK_USER_ID)
    if status: q = q.where(Application.status == status)
    return (await db.scalars(q)).all()

@router.post("/", response_model=ApplicationRead, status_code=201)
async def create_application(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app = Application(user_id=MOCK_USER_ID, **payload.model_dump())
    db.add(app); await db.flush(); return app

@router.patch("/{app_id}", response_model=ApplicationRead)
async def update_application(app_id: UUID, payload: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, app_id)
    if not app: raise HTTPException(status_code=404, detail="Application not found")
    for f, v in payload.model_dump(exclude_unset=True).items(): setattr(app, f, v)
    return app

@router.delete("/{app_id}", status_code=204)
async def delete_application(app_id: UUID, db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, app_id)
    if not app: raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)

@router.post("/{app_id}/interviews", response_model=InterviewRead, status_code=201)
async def add_interview(app_id: UUID, payload: InterviewCreate, db: AsyncSession = Depends(get_db)):
    if not await db.get(Application, app_id): raise HTTPException(status_code=404, detail="Application not found")
    interview = Interview(application_id=app_id, **payload.model_dump())
    db.add(interview); await db.flush(); return interview

@router.get("/{app_id}/interviews", response_model=list[InterviewRead])
async def list_interviews(app_id: UUID, db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Interview).where(Interview.application_id == app_id))).all()
