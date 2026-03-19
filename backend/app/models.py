from sqlalchemy import (
    Column, Integer, String, Text, TIMESTAMP, CheckConstraint,
    UniqueConstraint, ForeignKey, Index, func
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "learning"}

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class DictionaryWord(Base):
    __tablename__ = "dictionary_words"
    __table_args__ = {"schema": "learning"}

    id = Column(Integer, primary_key=True)
    word = Column(String(255), nullable=False, unique=True)
    hint_image_url_1 = Column(Text)
    hint_image_url_2 = Column(Text)
    hint_image_url_3 = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id"),
        CheckConstraint("score >= 0"),
        CheckConstraint("lives_lost >= 0"),
        Index("idx_user_progress_user_id", "user_id"),
        Index("idx_user_progress_word_id", "word_id"),
        {"schema": "learning"},
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("learning.users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Integer, ForeignKey("learning.dictionary_words.id", ondelete="RESTRICT"), nullable=False)
    score = Column(Integer, default=0)
    lives_lost = Column(Integer, default=0)
    last_interaction_date = Column(TIMESTAMP, server_default=func.now())
