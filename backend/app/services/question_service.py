from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import Question


def _normalize_options(options: list[str]) -> list[str]:
    cleaned = [option.strip() for option in options if option and option.strip()]
    if len(cleaned) < 2:
        raise ValueError("Informe pelo menos duas alternativas.")
    if len(cleaned) > 5:
        raise ValueError("No máximo cinco alternativas são permitidas.")
    return cleaned


def validate_question(statement: str, options: list[str], correct_index: int) -> tuple[str, list[str], int]:
    text = statement.strip()
    if not text:
        raise ValueError("O enunciado é obrigatório.")
    normalized = _normalize_options(options)
    if correct_index < 0 or correct_index >= len(normalized):
        raise ValueError("Selecione a alternativa correta.")
    return text, normalized, correct_index


def list_questions(db: Session) -> list[Question]:
    return list(db.scalars(select(Question).order_by(Question.id)).all())


def create_question(
    db: Session,
    *,
    statement: str,
    options: list[str],
    correct_index: int,
    explanation: str = "",
) -> Question:
    text, normalized, index = validate_question(statement, options, correct_index)
    question = Question(
        statement=text,
        options=normalized,
        correct_index=index,
        explanation=explanation.strip(),
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def update_question(
    db: Session,
    question_id: int,
    *,
    statement: str,
    options: list[str],
    correct_index: int,
    explanation: str = "",
) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise LookupError("Questão não encontrada.")
    text, normalized, index = validate_question(statement, options, correct_index)
    question.statement = text
    question.options = normalized
    question.correct_index = index
    question.explanation = explanation.strip()
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question_id: int) -> None:
    settings = get_settings()
    question = db.get(Question, question_id)
    if question is None:
        raise LookupError("Questão não encontrada.")
    remaining = db.query(Question).count() - 1
    if remaining < settings.min_question_count:
        raise ValueError(
            f"Não é possível excluir: o banco precisa manter pelo menos {settings.min_question_count} questões."
        )
    db.delete(question)
    db.commit()
