import csv
import io
import random
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import ExamConfig, ExamSession, Question, Result, Student


def authenticate(db: Session, login: str, senha: str) -> Student | None:
    student = db.scalar(select(Student).where(Student.login == login))
    if student is None or student.password != senha:
        return None
    return student


def _build_layout(db: Session, question_count: int) -> list[dict]:
    """Sorteia `question_count` questões e embaralha as alternativas de cada uma.

    Cada item do layout registra: o id da questão no banco, a ordem em que as
    alternativas foram exibidas (`option_order`, uma permutação dos índices
    originais). Isso permite corrigir depois sem reenviar o gabarito ao aluno.
    """
    all_ids = [row.id for row in db.execute(select(Question.id)).all()]
    chosen_ids = random.sample(all_ids, k=min(question_count, len(all_ids)))

    layout: list[dict] = []
    for position, qid in enumerate(chosen_ids):
        question = db.get(Question, qid)
        option_order = list(range(len(question.options)))
        random.shuffle(option_order)
        layout.append({"question_id": qid, "option_order": option_order, "position": position})
    return layout


def can_retake(db: Session, student: Student) -> bool:
    config = db.get(ExamConfig, 1)
    if config is not None and config.allow_retake_all:
        return True
    return student.allow_retake


def reset_session_for_retake(db: Session, student: Student) -> None:
    session = db.scalar(select(ExamSession).where(ExamSession.student_id == student.id))
    if session is None:
        return
    result = db.scalar(select(Result).where(Result.session_id == session.id))
    if result is not None:
        db.delete(result)
    db.delete(session)
    db.commit()
    db.expire(student, ["session"])


def get_or_create_session(db: Session, student: Student) -> tuple[ExamSession, bool]:
    """Devolve a prova do aluno. Se ainda não existir, sorteia e cria.
    O segundo valor indica se a prova já foi enviada e não pode ser refeita."""
    session = db.scalar(select(ExamSession).where(ExamSession.student_id == student.id))
    if session is not None and session.submitted:
        if can_retake(db, student):
            reset_session_for_retake(db, student)
            session = None
        else:
            return session, True

    if session is None:
        config = db.get(ExamConfig, 1)
        layout = _build_layout(db, config.question_count)
        session = ExamSession(
            student_id=student.id,
            layout=layout,
            time_minutes=config.time_minutes,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    return session, False


def render_exam_for_student(db: Session, session: ExamSession) -> list[dict]:
    """Monta as questões para envio ao aluno, SEM o gabarito, na ordem sorteada."""
    questions_out: list[dict] = []
    for item in session.layout:
        question = db.get(Question, item["question_id"])
        options = [{"text": question.options[i]} for i in item["option_order"]]
        questions_out.append(
            {"position": item["position"], "statement": question.statement, "options": options}
        )
    return questions_out


def grade_and_store(
    db: Session,
    student: Student,
    session: ExamSession,
    answers: list[dict],
    violations: int,
    finished_by: str,
) -> Result:
    """Corrige a prova no servidor e grava o resultado. Trava reenvio."""
    # Mapa posição -> índice marcado (na ordem EXIBIDA ao aluno)
    marked_by_position = {a["position"]: a.get("option_index") for a in answers}

    correct_count = 0
    detail_questions, detail_answers, detail_key = [], [], []

    for item in session.layout:
        question = db.get(Question, item["question_id"])
        displayed_marked = marked_by_position.get(item["position"])

        # Converte o índice exibido de volta ao índice original da alternativa.
        original_marked = (
            item["option_order"][displayed_marked]
            if displayed_marked is not None and 0 <= displayed_marked < len(item["option_order"])
            else None
        )
        is_correct = original_marked == question.correct_index
        if is_correct:
            correct_count += 1

        detail_questions.append(question.id)
        detail_answers.append("-" if original_marked is None else original_marked)
        detail_key.append(question.correct_index)

    total = len(session.layout)
    grade = round((correct_count / total) * 10, 2) if total else 0.0
    # `started_at` pode vir sem fuso em alguns bancos (ex.: SQLite); normaliza para UTC.
    started = session.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds())

    result = Result(
        session_id=session.id,
        login=student.login,
        correct_count=correct_count,
        total=total,
        grade=grade,
        violations=violations,
        elapsed_seconds=elapsed,
        finished_by=finished_by,
        detail={
            "questions": detail_questions,
            "answers": detail_answers,
            "key": detail_key,
        },
    )
    session.submitted = True
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def results_to_csv(results: list[Result]) -> str:
    """Gera o CSV consolidado de resultados (com BOM para abrir bem no Excel)."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["login", "acertos", "total", "nota", "violacoes", "tempo_s",
         "encerrado_por", "questoes_banco", "respostas_aluno", "gabarito", "data"]
    )
    for r in results:
        d = r.detail
        writer.writerow([
            r.login, r.correct_count, r.total, r.grade, r.violations, r.elapsed_seconds,
            r.finished_by,
            "|".join(str(x) for x in d["questions"]),
            "|".join(str(x) for x in d["answers"]),
            "|".join(str(x) for x in d["key"]),
            r.created_at.isoformat(),
        ])
    return "\ufeff" + buffer.getvalue()
