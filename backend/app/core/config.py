import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

EXPECTED_COORDINATES_LENGTH: int = 63
EXPECTED_FEATURES_LENGTH: int = 16

MODEL_PATH: str = os.getenv("MODEL_PATH", str(BASE_DIR / "assets" / "modelo_libras.pkl"))
STATS_PATH: str = os.getenv("STATS_PATH", str(BASE_DIR / "assets" / "standardization_stats.csv"))

DATABASE_URL: str = os.getenv("DATABASE_URL", "")

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
