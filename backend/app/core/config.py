from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_PROFESSOR_PASSWORD = "troque-esta-senha"


class Settings(BaseSettings):
    """Configuração da aplicação, lida de variáveis de ambiente (.env)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Banco de dados
    database_url: str = "postgresql+psycopg://prova:prova@db:5432/prova"

    # Senha única do professor (área de administração)
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

    def professor_password_is_configured(self) -> bool:
        password = self.professor_password.strip()
        return bool(password) and password != _DEFAULT_PROFESSOR_PASSWORD


@lru_cache
def get_settings() -> Settings:
    """Devolve uma instância única das configurações (cacheada)."""
    return Settings()
