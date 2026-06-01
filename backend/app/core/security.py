from jose import jwt
from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM


def decode_ws_token(token: str) -> dict:
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY não configurada.")
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
