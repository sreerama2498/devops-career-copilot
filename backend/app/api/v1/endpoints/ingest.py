from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.db.session import get_db
from app.services.ingest import ingest_jobs

router = APIRouter(prefix="/ingest", tags=["ingest"])

class IngestRequest(BaseModel):
    source: str
    jobs: list[dict[str, Any]]

class IngestResponse(BaseModel):
    source: str
    received: int
    inserted: int
    skipped: int

def verify_ingest_token(x_ingest_token: str = Header(default="")):
    settings = get_settings()
    if not settings.ingest_token:
        return  # dev mode — no token required
    if x_ingest_token != settings.ingest_token:
        raise HTTPException(status_code=401, detail="Invalid ingest token")

@router.post("/", response_model=IngestResponse)
async def ingest(
    payload: IngestRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_ingest_token),
):
    for job in payload.jobs:
        job.setdefault("source", payload.source)
    counts = await ingest_jobs(db, payload.jobs)
    return IngestResponse(source=payload.source, **counts)

@router.get("/health")
async def ingest_health():
    return {"status": "ok", "endpoint": "ingest"}
