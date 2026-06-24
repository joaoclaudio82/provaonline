import secrets

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_professor(x_professor_password: str = Header(default="")) -> None:
    """Protege os endpoints do professor.

    O front envia a senha no cabeçalho ``X-Professor-Password``. A comparação é
    feita em tempo constante para evitar ataques de temporização. Não há sessão:
    a senha acompanha cada requisição administrativa.
    """
    expected = get_settings().professor_password
    provided = x_professor_password or ""
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de professor inválida.",
        )
