import base64
import os
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_PROFESSOR_PASSWORD = "troque-esta-senha"
# Railway injeta referências (${{Postgres...}}) mas pode ignorar chaves com "PASSWORD".
_PROFESSOR_SECRET_ENV_KEYS = (
    "PROVA_ADMIN_SECRET",
    "ADMIN_SECRET",
    "PROFESSOR_SECRET",
)
_PROFESSOR_PASSWORD_ENV_KEYS = (
    "PROFESSOR_PASSWORD",
    "PROFESSOR_PASS",
    "ADMIN_PASSWORD",
)
_PROFESSOR_PASSWORD_B64_KEY = "PROFESSOR_PASSWORD_B64"
_ALL_PROFESSOR_ENV_KEYS = (
    *_PROFESSOR_SECRET_ENV_KEYS,
    _PROFESSOR_PASSWORD_B64_KEY,
    *_PROFESSOR_PASSWORD_ENV_KEYS,
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
    return {key: key in os.environ for key in _ALL_PROFESSOR_ENV_KEYS}


def _password_from_env_value(key: str, raw: str) -> str:
    if key == _PROFESSOR_PASSWORD_B64_KEY:
        try:
            decoded = base64.b64decode(raw.strip(), validate=True).decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            return ""
        return normalize_professor_password(decoded)
    return normalize_professor_password(raw)


def resolve_professor_password() -> str:
    """Lê a senha do professor das variáveis de ambiente conhecidas."""
    b64_raw = os.environ.get(_PROFESSOR_PASSWORD_B64_KEY)
    if b64_raw is not None and str(b64_raw).strip():
        password = _password_from_env_value(_PROFESSOR_PASSWORD_B64_KEY, b64_raw)
        if password:
            return password

    for key in (*_PROFESSOR_SECRET_ENV_KEYS, *_PROFESSOR_PASSWORD_ENV_KEYS):
        env_raw = os.environ.get(key)
        if env_raw is not None and str(env_raw).strip():
            return _password_from_env_value(key, env_raw)
    return get_settings().professor_password


def professor_password_is_configured() -> bool:
    password = resolve_professor_password().strip()
    return bool(password) and password != _DEFAULT_PROFESSOR_PASSWORD


@lru_cache
def get_settings() -> Settings:
    """Devolve uma instância única das configurações (cacheada)."""
    return Settings()
