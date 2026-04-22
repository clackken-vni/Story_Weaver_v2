import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import kb

app = FastAPI(title="KB Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kb.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "kb-service"}


@app.get("/api/v1/health")
async def api_health():
    return {"status": "ok", "service": "kb-service"}
