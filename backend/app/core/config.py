import os
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_PROFESSOR_PASSWORD = "troque-esta-senha"
_PROFESSOR_PASSWORD_ENV_KEYS = (
    "PROFESSOR_PASSWORD",
    "PROFESSOR_PASS",
    "ADMIN_PASSWORD",
)


def normalize_professor_password(value: object) -> str:
    if value is None:
        return _DEFAULT_PROFESSOR_PASSWORD
    text = str(value).strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in {'"', "'"}:
        text = text[1:-1].strip()
    return text


class Settings(BaseSettings):
    """Configuração da aplicação, lida de variáveis de ambiente (.env)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Banco de dados
    database_url: str = "postgresql+psycopg://prova:prova@db:5432/prova"

    # Senha única do professor (lida de PROFESSOR_PASSWORD via pydantic-settings).
    professor_password: str = _DEFAULT_PROFESSOR_PASSWORD

    # Origem permitida para o front (CORS). Use "*" só em desenvolvimento.
    cors_origins: str = "*"

    # Limites e padrões dos parâmetros da prova
    default_question_count: int = 20
    min_question_count: int = 5
    max_question_count: int = 50
    default_time_minutes: int = 120
    min_time_minutes: int = 5
    max_time_minutes: int = 300
    max_students: int = 50

    @field_validator("professor_password", mode="before")
    @classmethod
    def normalize_password_field(cls, value: object) -> str:
        return normalize_professor_password(value)


def professor_password_env_status() -> dict[str, bool]:
    """Indica quais chaves de senha existem no ambiente (sem expor valores)."""
    return {key: key in os.environ for key in _PROFESSOR_PASSWORD_ENV_KEYS}


def resolve_professor_password() -> str:
    """Lê a senha do professor das variáveis de ambiente conhecidas."""
    for key in _PROFESSOR_PASSWORD_ENV_KEYS:
        env_raw = os.environ.get(key)
        if env_raw is not None and str(env_raw).strip():
            return normalize_professor_password(env_raw)
    return get_settings().professor_password


def professor_password_is_configured() -> bool:
    password = resolve_professor_password().strip()
    return bool(password) and password != _DEFAULT_PROFESSOR_PASSWORD


@lru_cache
def get_settings() -> Settings:
    """Devolve uma instância única das configurações (cacheada)."""
    return Settings()
