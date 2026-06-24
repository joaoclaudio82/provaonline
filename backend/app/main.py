from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import get_engine, get_db
from app.models.entities import Base
from app.routers import admin, exam
from app.services import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas (idempotente) e popula o banco de questões e a config padrão.
    Base.metadata.create_all(bind=get_engine())
    db = next(get_db())
    try:
        seed.seed_questions(db)
        seed.ensure_config(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Prova Online API", version="1.0.0", lifespan=lifespan)

settings = get_settings()
origins = ["*"] if settings.cors_origins.strip() == "*" else [
    o.strip() for o in settings.cors_origins.split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exam.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["infra"])
def health() -> dict:
    return {"status": "ok"}
