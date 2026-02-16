from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models import Chapter, Chunk
from ..schemas import ChapterOut

router = APIRouter(prefix="/chapters", tags=["chapters"])

@router.get("/by-book/{book_id}", response_model=list[ChapterOut])
async def list_chapters(book_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Chapter).where(Chapter.book_id==book_id).order_by(Chapter.index.asc()))
    return res.scalars().all()

@router.get("/{chapter_id}/preview")
async def chapter_preview(chapter_id: int, db: AsyncSession = Depends(get_db)):
    # return first 2 chunks
    ch = (await db.execute(select(Chapter).where(Chapter.id==chapter_id))).scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Chapter not found")
    chunks = (await db.execute(
        select(Chunk).where(Chunk.chapter_id==chapter_id).order_by(Chunk.chunk_index.asc()).limit(2)
    )).scalars().all()
    return {"chapter_id": chapter_id, "title": ch.title, "preview": "\n\n".join([c.text for c in chunks])}
