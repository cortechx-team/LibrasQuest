import math

from pydantic import BaseModel, field_validator
from app.core.config import EXPECTED_COORDINATES_LENGTH, EXPECTED_FEATURES_LENGTH

class CoordinatesPayload(BaseModel):
    coordinates: list[float]
    features: list[float] | None = None
    handedness: str | None = None
    timestamp_ms: float | None = None

    @field_validator("coordinates", "features")
    @classmethod
    def validate_vectors(
        cls,
        value: list[float] | None,
        info,
    ) -> list[float] | None:
        if value is None:
            return value

        expected_length = (
            EXPECTED_COORDINATES_LENGTH
            if info.field_name == "coordinates"
            else EXPECTED_FEATURES_LENGTH
        )
        if len(value) != expected_length:
            raise ValueError(
                f"Esperados {expected_length} valores em '{info.field_name}'. "
                f"Recebidos: {len(value)}."
            )

        if not all(math.isfinite(item) for item in value):
            raise ValueError(f"Todos os valores de '{info.field_name}' devem ser finitos.")

        return value

class PredictionResponse(BaseModel):
    letter: str
    confidence: float
