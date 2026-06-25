import time


def normalize_database_url(url: str) -> str:
    """Converte URLs comuns (Railway, Heroku) para o driver psycopg instalado."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+psycopg" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url
