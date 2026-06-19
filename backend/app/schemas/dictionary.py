from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DictionaryWordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    created_at: datetime
