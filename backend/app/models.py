from sqlalchemy import (
    Column, Integer, SmallInteger, String, Text, TIMESTAMP, CheckConstraint,
    UniqueConstraint, ForeignKey, Index, func
)
from sqlalchemy.orm import DeclarativeBase, relationship


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


class WordImage(Base):
    __tablename__ = "word_images"
    __table_args__ = (
        Index("idx_word_images_word_id", "word_id"),
        {"schema": "learning"},
    )

    id = Column(Integer, primary_key=True)
    word_id = Column(Integer, ForeignKey("learning.dictionary_words.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(Text, nullable=False)
    position = Column(SmallInteger)
    created_at = Column(TIMESTAMP, server_default=func.now())


class DictionaryWord(Base):
    __tablename__ = "dictionary_words"
    __table_args__ = {"schema": "learning"}

    id = Column(Integer, primary_key=True)
    word = Column(String(255), nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    images = relationship("WordImage", backref="word", cascade="all, delete-orphan", order_by="WordImage.position")


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
