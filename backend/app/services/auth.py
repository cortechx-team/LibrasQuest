from sqlalchemy.orm import Session
from app.models import User
from app.core.security import hash_password, verify_password
from app.schemas.auth import RegisterRequest


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def register_user(data: RegisterRequest, db: Session) -> User:
    email = data.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise EmailAlreadyRegisteredError("E-mail já cadastrado.")

    user = User(
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(email: str, password: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError("Credenciais inválidas.")
    return user
