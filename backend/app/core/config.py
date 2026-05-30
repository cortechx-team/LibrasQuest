import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

EXPECTED_COORDINATES_LENGTH: int = 63

MODEL_PATH: str = os.getenv("MODEL_PATH", str(BASE_DIR / "assets" / "modelo_libras.pkl"))
STATS_PATH: str = os.getenv("STATS_PATH", str(BASE_DIR / "assets" / "standardization_stats.csv"))