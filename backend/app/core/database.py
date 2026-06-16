from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import DATABASE_URL

_db_url = (
    DATABASE_URL
    .replace("postgres://", "postgresql+pg8000://", 1)
    .replace("postgresql://", "postgresql+pg8000://", 1)
)

engine = create_engine(_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
