from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.routers import kb, documents, mapping, jobs, search

app = FastAPI(title="KB Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kb.router)
app.include_router(documents.router)
app.include_router(mapping.router)
app.include_router(jobs.router)
app.include_router(search.router)


@app.on_event("startup")
async def startup():
    await db.connect()
    await db.init_schema()


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "kb-service"}


@app.get("/api/v1/health")
async def api_health():
    return {"status": "ok", "service": "kb-service"}
