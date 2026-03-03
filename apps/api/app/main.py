from __future__ import annotations
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .db import engine, Base
from .routers import books, chapters, artifacts, jobs, generate, providers, flashcards

IMAGES_ROOT = "/data/images"

app = FastAPI(title="CourseGen API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health():
    return {"ok": True}

app.include_router(books.router)
app.include_router(chapters.router)
app.include_router(artifacts.router)
app.include_router(jobs.router)
app.include_router(generate.router)
app.include_router(providers.router)
app.include_router(flashcards.router)

# Serve extracted images as static files
os.makedirs(IMAGES_ROOT, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_ROOT), name="images")
