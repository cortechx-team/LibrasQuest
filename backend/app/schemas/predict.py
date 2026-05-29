from pydantic import BaseModel, field_validator
from app.core.config import EXPECTED_COORDINATES_LENGTH

class CoordinatesPayload(BaseModel):
    coordinates: list[float]

    @field_validator("coordinates")
    @classmethod
    def validate_length(cls, value: list[float]) -> list[float]:
        if len(value) != EXPECTED_COORDINATES_LENGTH:
            raise ValueError(
                f"Esperado {EXPECTED_COORDINATES_LENGTH} coordenadas. Recebido: {len(value)}."
            )
        return value

class PredictionResponse(BaseModel):
    letter: str
    confidence: float