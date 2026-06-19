import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.dictionary import router as dictionary_router
from app.api.websockets import router as websocket_router
from app.core.config import FRONTEND_ORIGIN
from app.services.inference import inference_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%H:%M:%S",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    inference_service.load_model()
    yield
    inference_service.unload_model()


app = FastAPI(
    title="LibrasQuest API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dictionary_router)
app.include_router(websocket_router)


@app.get("/")
def root():
    return {"message": "LibrasQuest API"}
