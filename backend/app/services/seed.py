import json
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import ExamConfig, ExamSession, Question, Result

_QUESTIONS_FILE = Path(__file__).resolve().parent.parent / "data" / "questions.json"


def _load_questions_from_file() -> list[Question]:
    raw = json.loads(_QUESTIONS_FILE.read_text(encoding="utf-8"))
    return [
        Question(
            statement=item["q"],
            options=item["o"],
            correct_index=item["c"],
            explanation=item.get("e", ""),
        )
        for item in raw
    ]


def seed_questions(db: Session) -> int:
    """Carrega o banco de questões do JSON para a tabela, se ainda estiver vazia.
    Devolve o total de questões disponíveis."""
    already_seeded = db.scalar(select(Question).limit(1)) is not None
    if not already_seeded:
        for question in _load_questions_from_file():
            db.add(question)
        db.commit()
    return db.query(Question).count()


def reload_questions(db: Session) -> int:
    """Substitui o banco de questões pelo JSON. Limpa provas e resultados em andamento."""
    db.execute(delete(Result))
    db.execute(delete(ExamSession))
    db.execute(delete(Question))
    db.commit()
    for question in _load_questions_from_file():
        db.add(question)
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
