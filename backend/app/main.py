from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.db.session import get_engine, get_session_factory
import app.db.session as db_module
from app.api.v1.router import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = get_engine()
    db_module.engine = engine
    db_module.AsyncSessionFactory = get_session_factory(engine)
    yield
    await engine.dispose()

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan, docs_url="/api/docs", redoc_url="/api/redoc")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)

@app.get("/health", tags=["health"])
async def health(): return {"status": "ok", "service": settings.app_name}
