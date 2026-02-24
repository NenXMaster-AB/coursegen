from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models import Chapter, Chunk, Image
from ..schemas import ChapterOut, ImageOut

router = APIRouter(prefix="/chapters", tags=["chapters"])

def _image_to_out(img: Image) -> ImageOut:
    url = f"/images/{img.book_id}/{img.filename}"
    return ImageOut(id=img.id, url=url, mime_type=img.mime_type, width=img.width, height=img.height)

@router.get("/by-book/{book_id}", response_model=list[ChapterOut])
async def list_chapters(book_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Chapter).where(Chapter.book_id==book_id).order_by(Chapter.index.asc()))
    chapters = res.scalars().all()

    # Fetch all images for this book's chapters in one query
    chapter_ids = [ch.id for ch in chapters]
    if chapter_ids:
        img_res = await db.execute(
            select(Image).where(Image.chapter_id.in_(chapter_ids))
        )
        all_images = img_res.scalars().all()
    else:
        all_images = []

    # Group images by chapter_id
    images_by_chapter: dict[int, list[ImageOut]] = {}
    for img in all_images:
        if img.chapter_id is not None:
            images_by_chapter.setdefault(img.chapter_id, []).append(_image_to_out(img))

    return [
        ChapterOut(
            id=ch.id,
            book_id=ch.book_id,
            index=ch.index,
            title=ch.title,
            word_count=ch.word_count,
            images=images_by_chapter.get(ch.id, []),
        )
        for ch in chapters
    ]

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
