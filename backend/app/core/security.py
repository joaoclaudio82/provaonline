import os

import secrets

from fastapi import Header, HTTPException, status

from app.core.config import professor_password_is_configured, resolve_professor_password


def require_professor(x_professor_password: str = Header(default="")) -> None:
    """Protege os endpoints do professor.

    O front envia a senha no cabeçalho ``X-Professor-Password``. A comparação é
    feita em tempo constante para evitar ataques de temporização. Não há sessão:
    a senha acompanha cada requisição administrativa.
    """
    if not professor_password_is_configured():
        env_present = "PROFESSOR_PASSWORD" in os.environ
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Senha do professor não configurada no servidor. "
                f"Variável PROFESSOR_PASSWORD no ambiente: {'sim' if env_present else 'não'}. "
                "Defina um valor real no Railway e faça redeploy."
            ),
        )
    expected = resolve_professor_password()
    provided = x_professor_password or ""
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de professor inválida.",
        )
