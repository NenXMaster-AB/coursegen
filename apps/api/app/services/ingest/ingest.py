from __future__ import annotations
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ...models import Book, Chapter, Chunk
from .pdf import extract_pdf
from .epub import extract_epub
from .text import extract_text
from .chapterize import chapterize
from .chunking import chunk_text, clean_text

SUPPORTED = {".pdf", ".epub", ".txt", ".md"}

async def ingest_book(session: AsyncSession, file_path: str, title: str | None = None, author: str | None = None) -> Book:
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED:
        raise ValueError(f"Unsupported file type: {ext}. Supported: {sorted(SUPPORTED)}")

    if ext == ".pdf":
        ex = extract_pdf(file_path)
        full_text = ex.text
        toc_titles = [t for (_, t, _) in ex.toc] if ex.toc else None
        source_type = "pdf"
    elif ext == ".epub":
        ex = extract_epub(file_path)
        full_text = ex.text
        toc_titles = None
        source_type = "epub"
    else:
        full_text = extract_text(file_path)
        toc_titles = None
        source_type = "text"

    full_text = clean_text(full_text)
    inferred_title = title or os.path.basename(file_path)
    book = Book(title=inferred_title, author=author, source_type=source_type)
    session.add(book)
    await session.flush()

    spans = chapterize(full_text, toc_titles=toc_titles)

    # store chapters + chunks
    for span in spans:
        ch_text = full_text[span.start:span.end].strip()
        words = len(ch_text.split())
        chapter = Chapter(
            book_id=book.id,
            index=span.index,
            title=span.title,
            start_offset=span.start,
            end_offset=span.end,
            word_count=words,
        )
        session.add(chapter)
        await session.flush()

        chunks = chunk_text(ch_text)
        for i, c in enumerate(chunks, start=1):
            session.add(Chunk(chapter_id=chapter.id, chunk_index=i, text=c))

    await session.commit()
    return book
