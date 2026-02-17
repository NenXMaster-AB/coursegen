from __future__ import annotations
import fitz  # PyMuPDF
from dataclasses import dataclass

@dataclass
class PdfExtract:
    text: str
    toc: list[tuple[int, str, int]]  # (level, title, page)
    page_offsets: list[int]  # 0-based character offsets by 1-based PDF page index

def extract_pdf(path: str) -> PdfExtract:
    doc = fitz.open(path)
    toc = doc.get_toc(simple=True)  # list [lvl, title, page]
    parts: list[str] = []
    page_offsets: list[int] = []
    cursor = 0
    total_pages = len(doc)
    for i, page in enumerate(doc):
        page_offsets.append(cursor)
        page_text = page.get_text("text")
        parts.append(page_text)
        cursor += len(page_text)
        if i < total_pages - 1:
            cursor += 1  # newline inserted by "\n".join(parts)
    text = "\n".join(parts)
    return PdfExtract(
        text=text,
        toc=[(lvl, title, page) for (lvl, title, page) in toc],
        page_offsets=page_offsets,
    )
