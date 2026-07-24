import os
import socket
import logging
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
    """Auto-create tables if running in SQLite fallback mode."""
    if "sqlite" in db_url:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency for obtaining async DB session."""
    await init_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
