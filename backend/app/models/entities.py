from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# Usa JSONB no PostgreSQL (indexável, eficiente) e cai para JSON genérico em outros
# bancos (ex.: SQLite nos testes). Mantém o código portável sem perder desempenho
# em produção.
JsonType = JSON().with_variant(JSONB(), "postgresql")


class Base(DeclarativeBase):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Question(Base):
    """Questão do banco. O índice correto (`correct_index`) nunca é enviado ao aluno."""

    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JsonType, nullable=False)  # lista de strings
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="")


class Student(Base):
    """Estudante autorizado, vindo do CSV enviado pelo professor."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    login: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(120), nullable=False)
    allow_retake: Mapped[bool] = mapped_column(Boolean, default=False)

    session: Mapped["ExamSession"] = relationship(back_populates="student", uselist=False)


class ExamConfig(Base):
    """Parâmetros da prova definidos pelo professor. Mantemos uma única linha (id=1)."""

    __tablename__ = "exam_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    allow_retake_all: Mapped[bool] = mapped_column(Boolean, default=False)


class ExamSession(Base):
    """Prova sorteada para um aluno.

    `layout` guarda a estrutura que o aluno recebeu (quais questões, em que ordem,
    e a permutação das alternativas), para que a correção use exatamente o que foi
    apresentado. O gabarito não vive aqui: é resolvido contra a tabela Question.
    """

    __tablename__ = "exam_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), unique=True, nullable=False)
    layout: Mapped[list] = mapped_column(JsonType, nullable=False)
    time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    submitted: Mapped[bool] = mapped_column(Boolean, default=False)

    student: Mapped["Student"] = relationship(back_populates="session")
    result: Mapped["Result"] = relationship(back_populates="session", uselist=False)


class Result(Base):
    """Resultado consolidado de uma prova enviada."""

    __tablename__ = "results"
    __table_args__ = (UniqueConstraint("session_id", name="uq_result_session"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("exam_sessions.id"), nullable=False)
    login: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[float] = mapped_column(nullable=False)
    violations: Mapped[int] = mapped_column(Integer, default=0)
    elapsed_seconds: Mapped[int] = mapped_column(Integer, default=0)
    finished_by: Mapped[str] = mapped_column(String(20), default="envio")
    detail: Mapped[dict] = mapped_column(JsonType, nullable=False)  # questões, respostas, gabarito
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped["ExamSession"] = relationship(back_populates="result")
