import secrets

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_professor(x_professor_password: str = Header(default="")) -> None:
    """Protege os endpoints do professor.

    O front envia a senha no cabeçalho ``X-Professor-Password``. A comparação é
    feita em tempo constante para evitar ataques de temporização. Não há sessão:
    a senha acompanha cada requisição administrativa.
    """
    settings = get_settings()
    if not settings.professor_password_is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Senha do professor não configurada no servidor. "
                "Defina PROFESSOR_PASSWORD no Railway (valor real, não vazio) e faça redeploy."
            ),
        )
    expected = settings.professor_password
    provided = x_professor_password or ""
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de professor inválida.",
        )
