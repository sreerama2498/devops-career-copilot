from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import CandidateProfile
from app.schemas.schemas import ProfileCreate, ProfileRead

router = APIRouter(prefix="/profile", tags=["profile"])
MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

@router.get("/", response_model=ProfileRead)
async def get_profile(db: AsyncSession = Depends(get_db)):
    profile = await db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == MOCK_USER_ID))
    if not profile: raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=ProfileRead, status_code=201)
async def create_profile(payload: ProfileCreate, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == MOCK_USER_ID)):
        raise HTTPException(status_code=400, detail="Profile already exists, use PATCH")
    profile = CandidateProfile(user_id=MOCK_USER_ID, **payload.model_dump())
    db.add(profile); await db.flush(); return profile

@router.patch("/", response_model=ProfileRead)
async def update_profile(payload: ProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = await db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == MOCK_USER_ID))
    if not profile: raise HTTPException(status_code=404, detail="Profile not found")
    for f, v in payload.model_dump(exclude_unset=True).items(): setattr(profile, f, v)
    return profile
