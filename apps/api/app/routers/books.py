from __future__ import annotations
import os, shutil, uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models import Book
from ..schemas import BookOut
from ..services.ingest.ingest import ingest_book

router = APIRouter(prefix="/books", tags=["books"])

UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=list[BookOut])
async def list_books(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Book).order_by(Book.created_at.desc()))
    return res.scalars().all()

@router.post("/ingest", response_model=BookOut)
async def ingest(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    author: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".pdf",".epub",".txt",".md"}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF/EPUB/TXT/MD.")

    uid = uuid.uuid4().hex
    path = os.path.join(UPLOAD_DIR, f"{uid}{ext}")
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    book = await ingest_book(db, path, title=title, author=author)
    return book
