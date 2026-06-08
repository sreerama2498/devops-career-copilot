from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str; token_type: str = "bearer"

class UserCreate(BaseModel):
    email: EmailStr; password: str; full_name: Optional[str] = None

class UserRead(BaseModel):
    id: UUID; email: str; full_name: Optional[str]; is_active: bool; created_at: datetime
    model_config = {"from_attributes": True}

class ProfileCreate(BaseModel):
    title: Optional[str] = None; years_experience: Optional[int] = None
    location: Optional[str] = None; remote_preference: Optional[str] = None
    skills: list[str] = []; resume_text: Optional[str] = None
    salary_min: Optional[int] = None; salary_max: Optional[int] = None

class ProfileRead(ProfileCreate):
    id: UUID; user_id: UUID; created_at: datetime; updated_at: datetime
    model_config = {"from_attributes": True}

class JobRead(BaseModel):
    id: UUID; source: str; title: str; company: str; location: Optional[str]
    is_remote: bool; employment_type: Optional[str]
    salary_min: Optional[int]; salary_max: Optional[int]; currency: str; url: str
    posted_at: Optional[datetime]; collected_at: datetime; required_skills: list[str]
    model_config = {"from_attributes": True}

class JobWithScore(JobRead):
    overall_score: Optional[float] = None; ats_score: Optional[float] = None
    skill_gaps: list[str] = []; matched_skills: list[str] = []; ai_summary: Optional[str] = None

class ApplicationCreate(BaseModel):
    job_id: UUID; notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None; notes: Optional[str] = None
    cover_letter: Optional[str] = None; follow_up_at: Optional[datetime] = None

class ApplicationRead(BaseModel):
    id: UUID; user_id: UUID; job_id: UUID; status: str
    applied_at: Optional[datetime]; notes: Optional[str]; follow_up_at: Optional[datetime]
    created_at: datetime; updated_at: datetime
    model_config = {"from_attributes": True}

class InterviewCreate(BaseModel):
    round: int = 1; interview_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None; interviewer_name: Optional[str] = None; notes: Optional[str] = None

class InterviewRead(InterviewCreate):
    id: UUID; application_id: UUID; outcome: Optional[str]; created_at: datetime
    model_config = {"from_attributes": True}

class DashboardStats(BaseModel):
    jobs_collected_today: int; avg_match_score: float
    active_applications: int; interviews_scheduled: int
    applications_by_status: dict[str, int]
