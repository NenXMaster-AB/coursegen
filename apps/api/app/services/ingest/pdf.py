from __future__ import annotations
import fitz  # PyMuPDF
from dataclasses import dataclass

@dataclass
class PdfExtract:
    text: str
    toc: list[tuple[int, str, int]]  # (level, title, page)

def extract_pdf(path: str) -> PdfExtract:
    doc = fitz.open(path)
    toc = doc.get_toc(simple=True)  # list [lvl, title, page]
    parts: list[str] = []
    for page in doc:
        parts.append(page.get_text("text"))
    text = "\n".join(parts)
    return PdfExtract(text=text, toc=[(lvl, title, page) for (lvl, title, page) in toc])
