from datetime import datetime

from pydantic import BaseModel, Field


# ---------- Aluno ----------

class LoginRequest(BaseModel):
    login: str
    senha: str


class OptionOut(BaseModel):
    """Alternativa entregue ao aluno: apenas a letra de exibição e o texto.
    Note que NÃO há indicação de qual é a correta."""
    text: str


class QuestionOut(BaseModel):
    """Questão entregue ao aluno, sem gabarito."""
    position: int
    statement: str
    options: list[OptionOut]


class ExamOut(BaseModel):
    login: str
    time_minutes: int
    started_at: datetime
    questions: list[QuestionOut]


class AnswerIn(BaseModel):
    position: int
    option_index: int | None = None  # índice da alternativa marcada (na ordem exibida)


class SubmitRequest(BaseModel):
    login: str
    senha: str
    answers: list[AnswerIn]
    violations: int = 0
    finished_by: str = "envio"


class ResultOut(BaseModel):
    login: str
    correct_count: int
    total: int
    grade: float
    violations: int
    elapsed_seconds: int
    finished_by: str


# ---------- Professor ----------

class ConfigIn(BaseModel):
    question_count: int = Field(..., ge=1)
    time_minutes: int = Field(..., ge=1)
    allow_retake_all: bool = False


class ConfigOut(BaseModel):
    question_count: int
    time_minutes: int
    allow_retake_all: bool
    max_question_count: int
    min_question_count: int
    min_time_minutes: int
    max_time_minutes: int


class RosterUploadOut(BaseModel):
    loaded: int


class StudentCredential(BaseModel):
    login: str
    senha: str


class StudentRow(BaseModel):
    id: int
    login: str
    senha: str
    allow_retake: bool
    exam_status: str


class StudentIn(BaseModel):
    login: str = Field(..., min_length=1)
    senha: str = Field(..., min_length=1)
    allow_retake: bool = False


class StudentUpdateIn(BaseModel):
    login: str = Field(..., min_length=1)
    senha: str = Field(..., min_length=1)
    allow_retake: bool = False


class RosterGenerateIn(BaseModel):
    count: int = Field(..., ge=1)


class RosterGenerateOut(BaseModel):
    loaded: int
    students: list[StudentRow]


class ResultRow(BaseModel):
    login: str
    correct_count: int
    total: int
    grade: float
    violations: int
    elapsed_seconds: int
    finished_by: str
    created_at: datetime


class QuestionAdmin(BaseModel):
    """Questão com gabarito, exposta apenas em endpoints de professor."""
    id: int
    statement: str
    options: list[str]
    correct_index: int
    explanation: str


class QuestionIn(BaseModel):
    statement: str = Field(..., min_length=1)
    options: list[str] = Field(..., min_length=2, max_length=5)
    correct_index: int = Field(..., ge=0)
    explanation: str = ""
