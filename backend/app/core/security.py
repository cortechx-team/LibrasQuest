from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET_KEY

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY não configurada no ambiente do servidor.")

    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_ws_token(token: str) -> dict:
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY não configurada no ambiente do servidor.")
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
