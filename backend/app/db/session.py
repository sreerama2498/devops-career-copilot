from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

class Base(DeclarativeBase):
    pass

def get_engine():
    settings = get_settings()
    return create_async_engine(settings.database_url, echo=settings.environment=="development", pool_pre_ping=True, pool_size=10, max_overflow=20)

def get_session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

engine = None
AsyncSessionFactory = None

async def get_db() -> AsyncSession:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
