import logging
import time

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.config import get_settings
from app.core.database import get_db, get_engine
from app.core.migrations import migrate_schema
from app.models.entities import Base
from app.services import seed

logger = logging.getLogger("uvicorn.error")


def initialize_database(max_attempts: int = 30, delay_seconds: float = 2.0) -> None:
    """Cria tabelas, migra e faz seed. Repete até o PostgreSQL ficar disponível."""
    settings = get_settings()
    if settings.professor_password_is_configured():
        logger.info("PROFESSOR_PASSWORD: configurada.")
    else:
        logger.warning(
            "PROFESSOR_PASSWORD ausente ou inválida. "
            "Defina a variável no Railway e redeploy antes de usar a área do professor."
        )

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
