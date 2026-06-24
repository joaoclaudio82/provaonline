import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import ExamConfig, Question

_QUESTIONS_FILE = Path(__file__).resolve().parent.parent / "data" / "questions.json"


def seed_questions(db: Session) -> int:
    """Carrega o banco de questões do JSON para a tabela, se ainda estiver vazia.
    Devolve o total de questões disponíveis."""
    already_seeded = db.scalar(select(Question).limit(1)) is not None
    if not already_seeded:
        raw = json.loads(_QUESTIONS_FILE.read_text(encoding="utf-8"))
        for item in raw:
            db.add(
                Question(
                    statement=item["q"],
                    options=item["o"],
                    correct_index=item["c"],
                    explanation=item.get("e", ""),
                )
            )
        db.commit()
    return db.query(Question).count()


def ensure_config(db: Session) -> ExamConfig:
    """Garante a linha única de configuração, criando-a com os padrões se faltar."""
    config = db.get(ExamConfig, 1)
    if config is None:
        settings = get_settings()
        config = ExamConfig(
            id=1,
            question_count=settings.default_question_count,
            time_minutes=settings.default_time_minutes,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config
