import secrets

from fastapi import Header, HTTPException, status

from app.core.config import (
    professor_password_env_status,
    professor_password_is_configured,
    resolve_professor_password,
)


def require_professor(x_professor_password: str = Header(default="")) -> None:
    """Protege os endpoints do professor.

    O front envia a senha no cabeçalho ``X-Professor-Password``. A comparação é
    feita em tempo constante para evitar ataques de temporização. Não há sessão:
    a senha acompanha cada requisição administrativa.
    """
    if not professor_password_is_configured():
        env_status = professor_password_env_status()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Senha do professor não configurada no servidor. "
                f"Variáveis no ambiente: {env_status}. "
                "No Railway, use PROVA_ADMIN_SECRET (sem a palavra PASSWORD no nome) "
                "com valor literal no serviço provaonline e faça redeploy."
            ),
        )
    expected = resolve_professor_password()
    provided = x_professor_password or ""
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de professor inválida.",
        )
