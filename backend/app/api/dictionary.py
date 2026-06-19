from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import DictionaryWord
from app.schemas.dictionary import DictionaryWordResponse

router = APIRouter(prefix="/dictionary", tags=["dictionary"])


@router.get("/words", response_model=list[DictionaryWordResponse])
def list_words(db: Session = Depends(get_db)):
    return (
        db.query(DictionaryWord)
        .order_by(DictionaryWord.word.asc())
        .all()
    )
