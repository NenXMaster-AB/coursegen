from __future__ import annotations
import io
import logging
import fitz  # PyMuPDF
from dataclasses import dataclass, field
from typing import TypedDict

logger = logging.getLogger(__name__)

MIN_IMAGE_BYTES = 5 * 1024  # 5 KB
MIN_IMAGE_DIM = 50  # pixels


class ExtractedImage(TypedDict):
    data: bytes
    ext: str
    mime: str
    page: int
    offset: int
    width: int
    height: int


@dataclass
class PdfExtract:
    text: str
    toc: list[tuple[int, str, int]]  # (level, title, page)
    page_offsets: list[int]  # 0-based character offsets by 1-based PDF page index
    images: list[ExtractedImage] = field(default_factory=list)

def extract_pdf(path: str) -> PdfExtract:
    doc = fitz.open(path)
    toc = doc.get_toc(simple=True)  # list [lvl, title, page]
    parts: list[str] = []
    page_offsets: list[int] = []
    images: list[ExtractedImage] = []
    cursor = 0
    total_pages = len(doc)
    for i, page in enumerate(doc):
        page_offsets.append(cursor)
        page_text = page.get_text("text")
        parts.append(page_text)

        # Extract images from this page
        try:
            for img_index, img_info in enumerate(page.get_images(full=True)):
                xref = img_info[0]
                try:
                    extracted = doc.extract_image(xref)
                    if not extracted or not extracted.get("image"):
                        continue
                    img_bytes = extracted["image"]
                    if len(img_bytes) < MIN_IMAGE_BYTES:
                        continue
                    w = extracted.get("width", 0)
                    h = extracted.get("height", 0)
                    if w < MIN_IMAGE_DIM or h < MIN_IMAGE_DIM:
                        continue
                    ext = extracted.get("ext", "png")
                    mime_map = {
                        "png": "image/png",
                        "jpeg": "image/jpeg",
                        "jpg": "image/jpeg",
                        "webp": "image/webp",
                        "gif": "image/gif",
                        "bmp": "image/bmp",
                        "tiff": "image/tiff",
                    }
                    mime = mime_map.get(ext, f"image/{ext}")
                    images.append(ExtractedImage(
                        data=img_bytes,
                        ext=ext,
                        mime=mime,
                        page=i,
                        offset=cursor,
                        width=w,
                        height=h,
                    ))
                except Exception:
                    logger.debug("Failed to extract image xref %d on page %d", xref, i)
        except Exception:
            logger.debug("Failed to get images from page %d", i)

        cursor += len(page_text)
        if i < total_pages - 1:
            cursor += 1  # newline inserted by "\n".join(parts)
    text = "\n".join(parts)
    return PdfExtract(
        text=text,
        toc=[(lvl, title, page) for (lvl, title, page) in toc],
        page_offsets=page_offsets,
        images=images,
    )
