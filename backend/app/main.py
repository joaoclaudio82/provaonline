from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.startup import initialize_database
from app.routers import admin, exam

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
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


def _mount_frontend() -> None:
    if not FRONTEND_DIR.is_dir():
        return

    styles_dir = FRONTEND_DIR / "styles"
    src_dir = FRONTEND_DIR / "src"
    if styles_dir.is_dir():
        app.mount("/styles", StaticFiles(directory=styles_dir), name="frontend-styles")
    if src_dir.is_dir():
        app.mount("/src", StaticFiles(directory=src_dir), name="frontend-src")

    index_file = FRONTEND_DIR / "index.html"

    @app.get("/", include_in_schema=False)
    def serve_index() -> FileResponse:
        return FileResponse(index_file)


_mount_frontend()
