from __future__ import annotations
import logging
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ...models import Book, Chapter, Chunk, Image
from .pdf import extract_pdf, ExtractedImage as PdfExtractedImage
from .epub import extract_epub, ExtractedImage as EpubExtractedImage
from .text import extract_text
from .chapterize import chapterize
from .chunking import chunk_text, clean_text

logger = logging.getLogger(__name__)

SUPPORTED = {".pdf", ".epub", ".txt", ".md"}
IMAGES_ROOT = "/data/images"


def _save_images_to_disk(
    book_id: int,
    images: list[PdfExtractedImage] | list[EpubExtractedImage],
    source_type: str,
) -> list[dict]:
    """Save extracted image bytes to disk and return metadata dicts."""
    if not images:
        return []
    book_dir = os.path.join(IMAGES_ROOT, str(book_id))
    os.makedirs(book_dir, exist_ok=True)

    saved: list[dict] = []
    seen_xrefs: set[bytes] = set()  # deduplicate identical image data

    for idx, img in enumerate(images):
        # Simple deduplication by first 64 bytes + length
        sig = img["data"][:64] + len(img["data"]).to_bytes(8, "big")
        if sig in seen_xrefs:
            continue
        seen_xrefs.add(sig)

        if source_type == "pdf":
            filename = f"{book_id}_{img['page']}_{idx}.{img['ext']}"
        else:
            filename = f"{book_id}_{idx}.{img['ext']}"

        filepath = os.path.join(book_dir, filename)
        with open(filepath, "wb") as f:
            f.write(img["data"])

        saved.append({
            "filename": filename,
            "mime_type": img["mime"],
            "source_page": img["page"],
            "position_offset": img["offset"],
            "width": img["width"],
            "height": img["height"],
        })

    return saved


async def ingest_book(session: AsyncSession, file_path: str, title: str | None = None, author: str | None = None) -> Book:
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED:
        raise ValueError(f"Unsupported file type: {ext}. Supported: {sorted(SUPPORTED)}")

    toc_entries: list[tuple[int, str, int]] | None = None
    page_offsets: list[int] | None = None
    extracted_images: list[PdfExtractedImage] | list[EpubExtractedImage] = []

    if ext == ".pdf":
        ex = extract_pdf(file_path)
        full_text = ex.text
        toc_titles = [t for (_, t, _) in ex.toc] if ex.toc else None
        toc_entries = ex.toc or None
        page_offsets = ex.page_offsets
        extracted_images = ex.images
        source_type = "pdf"
    elif ext == ".epub":
        ex = extract_epub(file_path)
        full_text = ex.text
        toc_titles = None
        extracted_images = ex.images
        source_type = "epub"
    else:
        full_text = extract_text(file_path)
        toc_titles = None
        source_type = "text"

    # Keep raw PDF text when using page-based TOC offsets so slicing remains aligned.
    if not (toc_entries and page_offsets):
        full_text = clean_text(full_text)
    inferred_title = title or os.path.basename(file_path)
    book = Book(title=inferred_title, author=author, source_type=source_type)
    session.add(book)
    await session.flush()

    # Save extracted images to disk
    image_records = _save_images_to_disk(book.id, extracted_images, source_type)

    spans = chapterize(
        full_text,
        toc_titles=toc_titles,
        toc_entries=toc_entries,
        page_offsets=page_offsets,
    )

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

        # Assign images to this chapter based on position_offset
        for img_rec in image_records:
            offset = img_rec.get("position_offset")
            if offset is not None and span.start <= offset < span.end:
                session.add(Image(
                    book_id=book.id,
                    chapter_id=chapter.id,
                    filename=img_rec["filename"],
                    mime_type=img_rec["mime_type"],
                    source_page=img_rec["source_page"],
                    position_offset=offset,
                    width=img_rec["width"],
                    height=img_rec["height"],
                ))

    # Save any images that didn't fall into a chapter (offset before first or after last)
    assigned_offsets = set()
    for span in spans:
        for img_rec in image_records:
            offset = img_rec.get("position_offset")
            if offset is not None and span.start <= offset < span.end:
                assigned_offsets.add(id(img_rec))

    for img_rec in image_records:
        if id(img_rec) not in assigned_offsets:
            session.add(Image(
                book_id=book.id,
                chapter_id=None,
                filename=img_rec["filename"],
                mime_type=img_rec["mime_type"],
                source_page=img_rec["source_page"],
                position_offset=img_rec.get("position_offset"),
                width=img_rec["width"],
                height=img_rec["height"],
            ))

    await session.commit()
    return book
