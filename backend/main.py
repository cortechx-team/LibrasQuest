import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.websockets import router as websocket_router
from app.services.inference import inference_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    inference_service.load_model()
    yield
    inference_service.unload_model()

app = FastAPI(
    title="LibrasQuest Inference API",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(websocket_router)