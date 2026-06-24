import csv
import io

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import ExamSession, Result, Student


def parse_roster_csv(content: str) -> list[tuple[str, str]]:
    """Lê o CSV de estudantes. Aceita vírgula ou ponto e vírgula e cabeçalho opcional.
    Devolve pares (login, senha)."""
    students: list[tuple[str, str]] = []
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        # Detecta o separador predominante na linha.
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


def list_roster(db: Session) -> list[tuple[str, str]]:
    rows = db.scalars(select(Student).order_by(Student.login)).all()
    return [(row.login, row.password) for row in rows]


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
        db.add(Student(login=login, password=password))
    db.commit()
    return len(pairs)
