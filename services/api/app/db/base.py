import os
import socket
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("db_engine")


class Base(DeclarativeBase):
    pass


def is_postgres_available(host: str, port: int) -> bool:
    """Check if PostgreSQL server is accepting TCP connections."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.0)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def get_engine_url() -> str:
    pg_host = settings.POSTGRES_HOST
    pg_port = settings.POSTGRES_PORT
    if is_postgres_available(pg_host, pg_port):
        logger.info(f"Connecting to PostgreSQL database at {pg_host}:{pg_port}")
        return settings.get_database_url()
    else:
        logger.warning(f"PostgreSQL at {pg_host}:{pg_port} is offline. Using local SQLite development fallback.")
        return "sqlite+aiosqlite:///./alfacareers_dev.db"


db_url = get_engine_url()

engine = create_async_engine(
    db_url,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def init_db():
    """Auto-create tables & execute seamless SQLite column migrations."""
    if "sqlite" in db_url:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            # 1. candidate_profiles columns
            cand_cols = [
                ("target_roles", "JSON DEFAULT '[]'"),
                ("preferred_locations", "JSON DEFAULT '[]'"),
                ("job_type", "VARCHAR DEFAULT 'Full-Time'"),
                ("notice_period", "VARCHAR DEFAULT 'Immediate'"),
                ("expected_salary", "VARCHAR DEFAULT 'Negotiable'"),
                ("expected_salary_currency", "VARCHAR DEFAULT 'AED'"),
                ("expected_salary_amount", "VARCHAR DEFAULT '15,000'"),
                ("expected_salary_frequency", "VARCHAR DEFAULT 'Monthly'"),
                ("is_salary_negotiable", "BOOLEAN DEFAULT 1"),
                ("total_experience_years", "VARCHAR DEFAULT '0.0 Years'"),
                ("ai_executive_summary", "TEXT")
            ]
            for col_name, col_type in cand_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE candidate_profiles ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass

            # 2. job_posts columns
            job_cols = [
                ("company_id", "INTEGER"),
                ("status", "VARCHAR DEFAULT 'published'"),
                ("vector_indexed", "BOOLEAN DEFAULT 1")
            ]
            for col_name, col_type in job_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE job_posts ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass

            # 3. employer_profiles columns
            emp_cols = [
                ("industry", "VARCHAR"),
                ("company_size", "VARCHAR"),
                ("website", "VARCHAR"),
                ("description", "TEXT")
            ]
            for col_name, col_type in emp_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE employer_profiles ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass


async def get_db():
    """Dependency for obtaining async DB session."""
    await init_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
