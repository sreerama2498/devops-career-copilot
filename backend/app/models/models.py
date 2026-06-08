import uuid, enum
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Numeric, Text, ARRAY, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

def now_utc(): return datetime.now(timezone.utc)

class JobSource(str, enum.Enum):
    linkedin="linkedin"; indeed="indeed"; remoteok="remoteok"
    wellfound="wellfound"; company_portal="company_portal"; other="other"

class ApplicationStatus(str, enum.Enum):
    saved="saved"; applied="applied"; screening="screening"
    interview="interview"; offer="offer"; rejected="rejected"; withdrawn="withdrawn"

class EmploymentType(str, enum.Enum):
    full_time="full_time"; part_time="part_time"; contract="contract"; freelance="freelance"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    hashed_password = Column(Text, nullable=False)
    full_name = Column(Text)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    applications = relationship("Application", back_populates="user")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text); years_experience = Column(Integer); location = Column(Text)
    remote_preference = Column(Text); skills = Column(ARRAY(Text), default=list)
    resume_text = Column(Text); resume_url = Column(Text)
    salary_min = Column(Integer); salary_max = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    user = relationship("User", back_populates="profile")
    scores = relationship("JobScore", back_populates="profile")

class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("source", "external_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(Text); source = Column(Enum(JobSource), nullable=False)
    title = Column(Text, nullable=False); company = Column(Text, nullable=False)
    location = Column(Text); is_remote = Column(Boolean, default=False)
    employment_type = Column(Enum(EmploymentType))
    salary_min = Column(Integer); salary_max = Column(Integer); currency = Column(Text, default="USD")
    description = Column(Text); required_skills = Column(ARRAY(Text), default=list)
    url = Column(Text, nullable=False); posted_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    collected_at = Column(DateTime(timezone=True), default=now_utc)
    is_active = Column(Boolean, nullable=False, default=True)
    scores = relationship("JobScore", back_populates="job")
    applications = relationship("Application", back_populates="job")

class JobScore(Base):
    __tablename__ = "job_scores"
    __table_args__ = (UniqueConstraint("job_id", "profile_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Numeric(5,2)); ats_score = Column(Numeric(5,2)); skills_match = Column(Numeric(5,2))
    skill_gaps = Column(ARRAY(Text), default=list); matched_skills = Column(ARRAY(Text), default=list)
    ai_summary = Column(Text); scored_at = Column(DateTime(timezone=True), default=now_utc)
    job = relationship("Job", back_populates="scores")
    profile = relationship("CandidateProfile", back_populates="scores")

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "job_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.saved)
    applied_at = Column(DateTime(timezone=True)); resume_used = Column(Text)
    cover_letter = Column(Text); notes = Column(Text); follow_up_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    interviews = relationship("Interview", back_populates="application")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    round = Column(Integer, nullable=False, default=1); interview_type = Column(Text)
    scheduled_at = Column(DateTime(timezone=True)); interviewer_name = Column(Text)
    interviewer_role = Column(Text); notes = Column(Text); outcome = Column(Text)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    application = relationship("Application", back_populates="interviews")
