from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dto import ExamOut, LoginRequest, ResultOut, SubmitRequest
from app.services import exam_service

router = APIRouter(prefix="/api/exam", tags=["aluno"])


@router.post("/start", response_model=ExamOut)
def start_exam(payload: LoginRequest, db: Session = Depends(get_db)) -> ExamOut:
    """Autentica o aluno e devolve a prova (sem gabarito). Sorteia na primeira vez;
    nas seguintes, devolve a mesma prova. Recusa se já foi enviada."""
    student = exam_service.authenticate(db, payload.login, payload.senha)
    if student is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login ou senha inválidos.")

    session, already_submitted = exam_service.get_or_create_session(db, student)
    if already_submitted:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este login já realizou a prova.")

    questions = exam_service.render_exam_for_student(db, session)
    return ExamOut(
        login=student.login,
        time_minutes=session.time_minutes,
        started_at=session.started_at,
        questions=questions,
    )


@router.post("/submit", response_model=ResultOut)
def submit_exam(payload: SubmitRequest, db: Session = Depends(get_db)) -> ResultOut:
    """Recebe as respostas, corrige no servidor e grava o resultado."""
    student = exam_service.authenticate(db, payload.login, payload.senha)
    if student is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login ou senha inválidos.")

    session, already_submitted = exam_service.get_or_create_session(db, student)
    if already_submitted:
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta prova já foi enviada.")

    answers = [a.model_dump() for a in payload.answers]
    result = exam_service.grade_and_store(
        db, student, session, answers, payload.violations, payload.finished_by
    )
    return ResultOut(
        login=result.login,
        correct_count=result.correct_count,
        total=result.total,
        grade=result.grade,
        violations=result.violations,
        elapsed_seconds=result.elapsed_seconds,
        finished_by=result.finished_by,
    )
