from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_engine = create_engine(get_settings().database_url, pool_pre_ping=True, future=True)
_SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


def get_engine():
    return _engine


def get_db() -> Generator[Session, None, None]:
    """Dependência do FastAPI: abre uma sessão por requisição e fecha ao final."""
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
