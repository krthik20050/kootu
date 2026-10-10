from collections.abc import Generator

from fastapi import HTTPException, Request
from sqlalchemy import Engine, create_engine
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import Settings


class Base(DeclarativeBase):
    pass


def build_engine(settings: Settings) -> Engine | None:
    if not settings.database_url or not settings.database_url.get_secret_value():
        return None
    url = settings.database_url.get_secret_value()
    if not url.startswith(("postgresql://", "postgresql+psycopg://")):
        raise ValueError("DATABASE_URL must use PostgreSQL; no in-memory production fallback")
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        connect_args={
            "connect_timeout": 8,
            "options": "-c statement_timeout=15000 -c search_path=public,extensions",
        },
    )


def get_session(request: Request) -> Generator[Session]:
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(503, "Database is not configured")
    with Session(engine, expire_on_commit=False) as session:
        try:
            yield session
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise HTTPException(409, "This change conflicts with the current ride state") from error
        except SQLAlchemyError as error:
            session.rollback()
            raise HTTPException(503, "Database temporarily unavailable; retry later") from error
