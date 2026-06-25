from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import require_professor
from app.models.entities import ExamConfig, Question, Result
from app.schemas.dto import (
    ConfigIn,
    ConfigOut,
    QuestionAdmin,
    QuestionIn,
    ResultRow,
    RosterGenerateIn,
    RosterGenerateOut,
    RosterUploadOut,
    StudentIn,
    StudentRow,
    StudentUpdateIn,
)
from app.services import exam_service, question_service, roster_service, seed

router = APIRouter(
    prefix="/api/admin",
    tags=["professor"],
    dependencies=[Depends(require_professor)],
)


def _config_out(db: Session) -> ConfigOut:
    settings = get_settings()
    config = seed.ensure_config(db)
    bank_size = db.query(Question).count()
    return ConfigOut(
        question_count=config.question_count,
        time_minutes=config.time_minutes,
        allow_retake_all=config.allow_retake_all,
        max_question_count=min(bank_size, settings.max_question_count),
        min_question_count=settings.min_question_count,
        min_time_minutes=settings.min_time_minutes,
        max_time_minutes=settings.max_time_minutes,
    )


@router.get("/config", response_model=ConfigOut)
def get_config(db: Session = Depends(get_db)) -> ConfigOut:
    return _config_out(db)


@router.put("/config", response_model=ConfigOut)
def update_config(payload: ConfigIn, db: Session = Depends(get_db)) -> ConfigOut:
    settings = get_settings()
    bank_size = db.query(Question).count()
    max_questions = min(bank_size, settings.max_question_count)

    errors = []
    if not (settings.min_question_count <= payload.question_count <= max_questions):
        errors.append(f"Questões devem estar entre {settings.min_question_count} e {max_questions}.")
    if not (settings.min_time_minutes <= payload.time_minutes <= settings.max_time_minutes):
        errors.append(f"Tempo deve estar entre {settings.min_time_minutes} e {settings.max_time_minutes} minutos.")
    if errors:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, " ".join(errors))

    config = seed.ensure_config(db)
    config.question_count = payload.question_count
    config.time_minutes = payload.time_minutes
    config.allow_retake_all = payload.allow_retake_all
    db.commit()
    return _config_out(db)


@router.post("/roster", response_model=RosterUploadOut)
async def upload_roster(file: UploadFile, db: Session = Depends(get_db)) -> RosterUploadOut:
    content = (await file.read()).decode("utf-8-sig", errors="replace")
    pairs = roster_service.parse_roster_csv(content)
    if not pairs:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "CSV inválido ou vazio.")
    loaded = roster_service.replace_roster(db, pairs)
    return RosterUploadOut(loaded=loaded)


@router.get("/roster", response_model=list[StudentRow])
def get_roster(db: Session = Depends(get_db)) -> list[StudentRow]:
    return [StudentRow(**row) for row in roster_service.list_roster_rows(db)]


@router.post("/students", response_model=StudentRow, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentIn, db: Session = Depends(get_db)) -> StudentRow:
    try:
        student = roster_service.create_student(
            db,
            login=payload.login,
            senha=payload.senha,
            allow_retake=payload.allow_retake,
        )
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error
    rows = roster_service.list_roster_rows(db)
    row = next(item for item in rows if item["id"] == student.id)
    return StudentRow(**row)


@router.put("/students/{student_id}", response_model=StudentRow)
def update_student(
    student_id: int, payload: StudentUpdateIn, db: Session = Depends(get_db)
) -> StudentRow:
    try:
        roster_service.update_student(
            db,
            student_id,
            login=payload.login,
            senha=payload.senha,
            allow_retake=payload.allow_retake,
        )
    except LookupError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error
    row = next(item for item in roster_service.list_roster_rows(db) if item["id"] == student_id)
    return StudentRow(**row)


@router.post("/roster/generate", response_model=RosterGenerateOut)
def generate_roster(payload: RosterGenerateIn, db: Session = Depends(get_db)) -> RosterGenerateOut:
    settings = get_settings()
    if payload.count > settings.max_students:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"A quantidade máxima é {settings.max_students} estudantes.",
        )
    try:
        pairs = roster_service.generate_roster_pairs(payload.count)
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error
    loaded = roster_service.replace_roster(db, pairs)
    students = [
        StudentRow(**row)
        for row in roster_service.list_roster_rows(db)
    ]
    return RosterGenerateOut(loaded=loaded, students=students)


def _question_admin(question: Question) -> QuestionAdmin:
    return QuestionAdmin(
        id=question.id,
        statement=question.statement,
        options=question.options,
        correct_index=question.correct_index,
        explanation=question.explanation,
    )


@router.get("/questions", response_model=list[QuestionAdmin])
def list_questions(db: Session = Depends(get_db)) -> list[QuestionAdmin]:
    return [_question_admin(question) for question in question_service.list_questions(db)]


@router.post("/questions", response_model=QuestionAdmin, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionIn, db: Session = Depends(get_db)) -> QuestionAdmin:
    try:
        question = question_service.create_question(
            db,
            statement=payload.statement,
            options=payload.options,
            correct_index=payload.correct_index,
            explanation=payload.explanation,
        )
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error
    return _question_admin(question)


@router.put("/questions/{question_id}", response_model=QuestionAdmin)
def update_question(
    question_id: int, payload: QuestionIn, db: Session = Depends(get_db)
) -> QuestionAdmin:
    try:
        question = question_service.update_question(
            db,
            question_id,
            statement=payload.statement,
            options=payload.options,
            correct_index=payload.correct_index,
            explanation=payload.explanation,
        )
    except LookupError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error
    return _question_admin(question)


@router.post("/questions/reload", response_model=dict)
def reload_questions(db: Session = Depends(get_db)) -> dict:
    """Recarrega o banco de questões a partir do arquivo JSON do servidor."""
    total = seed.reload_questions(db)
    return {"reloaded": total}


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> None:
    try:
        question_service.delete_question(db, question_id)
    except LookupError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error


@router.get("/results", response_model=list[ResultRow])
def list_results(db: Session = Depends(get_db)) -> list[ResultRow]:
    rows = db.scalars(select(Result).order_by(Result.created_at)).all()
    return [
        ResultRow(
            login=r.login,
            correct_count=r.correct_count,
            total=r.total,
            grade=r.grade,
            violations=r.violations,
            elapsed_seconds=r.elapsed_seconds,
            finished_by=r.finished_by,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/results.csv", response_class=PlainTextResponse)
def export_results_csv(db: Session = Depends(get_db)) -> PlainTextResponse:
    rows = db.scalars(select(Result).order_by(Result.created_at)).all()
    csv_text = exam_service.results_to_csv(rows)
    return PlainTextResponse(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="resultados_prova.csv"'},
    )


@router.get("/gabarito", response_model=list[QuestionAdmin])
def list_gabarito(db: Session = Depends(get_db)) -> list[QuestionAdmin]:
    """Banco completo com gabarito. Só acessível com senha de professor."""
    return list_questions(db)
