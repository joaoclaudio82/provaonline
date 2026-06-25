import logging
import os
import time

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.config import (
    get_settings,
    professor_password_env_status,
    professor_password_is_configured,
    resolve_professor_password,
)
from app.core.database import get_db, get_engine
from app.core.migrations import migrate_schema
from app.models.entities import Base
from app.services import seed

logger = logging.getLogger("uvicorn.error")


def initialize_database(max_attempts: int = 30, delay_seconds: float = 2.0) -> None:
    """Cria tabelas, migra e faz seed. Repete até o PostgreSQL ficar disponível."""
    env_status = professor_password_env_status()
    env_length = len(os.environ.get("PROFESSOR_PASSWORD", ""))
    database_present = "DATABASE_URL" in os.environ
    if professor_password_is_configured():
        logger.info(
            "Senha do professor: configurada (env=%s, DATABASE_URL=%s).",
            env_status,
            database_present,
        )
    else:
        logger.warning(
            "Senha do professor ausente ou inválida (env=%s, DATABASE_URL=%s, "
            "tamanho_PROFESSOR_PASSWORD=%s). No Railway, use PROVA_ADMIN_SECRET "
            "(sem PASSWORD no nome da variável) e redeploy.",
            env_status,
            database_present,
            env_length,
        )
        _ = resolve_professor_password()

    get_settings()
    engine = get_engine()
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            migrate_schema(engine)
            db = next(get_db())
            try:
                seed.seed_questions(db)
                seed.ensure_config(db)
            finally:
                db.close()
            logger.info("Banco de dados inicializado (tentativa %s).", attempt)
            return
        except OperationalError as error:
            last_error = error
            logger.warning(
                "PostgreSQL indisponível (tentativa %s/%s): %s",
                attempt,
                max_attempts,
                error,
            )
            time.sleep(delay_seconds)

    raise RuntimeError(
        "Não foi possível conectar ao PostgreSQL após várias tentativas. "
        "Verifique se DATABASE_URL está configurada no Railway."
    ) from last_error
