import csv
import io
import random
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.models.entities import ExamConfig, ExamSession, Question, Result, Student


def _normalize_login(login: str) -> str:
    return login.strip()


def _normalize_password(password: str) -> str:
    return password.strip()


def _exam_status(session: ExamSession | None) -> str:
    if session is None:
        return "nao_iniciou"
    if session.submitted:
        return "enviada"
    return "em_andamento"


def list_roster_rows(db: Session) -> list[dict]:
    rows = db.scalars(
        select(Student).options(joinedload(Student.session)).order_by(Student.login)
    ).all()
    return [
        {
            "id": student.id,
            "login": student.login,
            "senha": student.password,
            "allow_retake": student.allow_retake,
            "exam_status": _exam_status(student.session),
        }
        for student in rows
    ]


def parse_roster_csv(content: str) -> list[tuple[str, str]]:
    """Lê o CSV de estudantes. Aceita vírgula ou ponto e vírgula e cabeçalho opcional.
    Devolve pares (login, senha)."""
    students: list[tuple[str, str]] = []
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        delimiter = ";" if line.count(";") > line.count(",") else ","
        parts = [p.strip().strip('"') for p in next(csv.reader([line], delimiter=delimiter))]
        if len(parts) < 2:
            continue
        if parts[0].lower() == "login":
            continue
        students.append((parts[0], parts[1]))
    return students


def generate_roster_pairs(count: int) -> list[tuple[str, str]]:
    """Gera logins aluno01… e senhas senha01… com o mesmo padding."""
    settings = get_settings()
    if count < 1 or count > settings.max_students:
        raise ValueError(f"A quantidade deve estar entre 1 e {settings.max_students}.")
    width = max(2, len(str(count)))
    return [(f"aluno{i:0{width}d}", f"senha{i:0{width}d}") for i in range(1, count + 1)]


def replace_roster(db: Session, pairs: list[tuple[str, str]]) -> int:
    """Substitui a turma inteira. Como a lista muda, limpamos provas e resultados
    anteriores para manter coerência (uma nova turma é uma nova aplicação)."""
    limit = get_settings().max_students
    pairs = pairs[:limit]

    db.execute(delete(Result))
    db.execute(delete(ExamSession))
    db.execute(delete(Student))
    db.commit()

    for login, password in pairs:
        db.add(Student(login=_normalize_login(login), password=_normalize_password(password)))
    db.commit()
    return len(pairs)


def _ensure_capacity(db: Session) -> None:
    if db.query(Student).count() >= get_settings().max_students:
        raise ValueError(f"A turma já atingiu o limite de {get_settings().max_students} estudantes.")


def create_student(db: Session, login: str, senha: str, allow_retake: bool = False) -> Student:
    login = _normalize_login(login)
    senha = _normalize_password(senha)
    if not login or not senha:
        raise ValueError("Login e senha são obrigatórios.")
    if db.scalar(select(Student).where(Student.login == login)):
        raise ValueError("Este login já está cadastrado.")
    _ensure_capacity(db)
    student = Student(login=login, password=senha, allow_retake=allow_retake)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(
    db: Session,
    student_id: int,
    login: str,
    senha: str,
    allow_retake: bool,
) -> Student:
    student = db.get(Student, student_id)
    if student is None:
        raise LookupError("Estudante não encontrado.")

    login = _normalize_login(login)
    senha = _normalize_password(senha)
    if not login or not senha:
        raise ValueError("Login e senha são obrigatórios.")

    duplicate = db.scalar(select(Student).where(Student.login == login, Student.id != student_id))
    if duplicate is not None:
        raise ValueError("Este login já está em uso por outro estudante.")

    old_login = student.login
    student.login = login
    student.password = senha
    student.allow_retake = allow_retake

    if old_login != login:
        result = db.scalar(
            select(Result)
            .join(ExamSession, Result.session_id == ExamSession.id)
            .where(ExamSession.student_id == student_id)
        )
        if result is not None:
            result.login = login

    db.commit()
    db.refresh(student)
    return student


def roster_to_csv(rows: list[dict]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["login", "senha", "status", "pode_refazer"])
    for row in rows:
        writer.writerow([row["login"], row["senha"], row["exam_status"], "sim" if row["allow_retake"] else "nao"])
    return "\ufeff" + buffer.getvalue()
