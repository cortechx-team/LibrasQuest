from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api.auth import router as auth_router

app = FastAPI(title="LibrasQuest API", version="0.1.0")

app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "LibrasQuest API"}
