from __future__ import annotations
from dataclasses import dataclass
from ebooklib import epub
from bs4 import BeautifulSoup

@dataclass
class EpubExtract:
    text: str

def extract_epub(path: str) -> EpubExtract:
    book = epub.read_epub(path)
    parts: list[str] = []
    for item in book.get_items():
        if item.get_type() == epub.EpubHtml.TYPE_DOCUMENT:
            soup = BeautifulSoup(item.get_body_content(), "html.parser")
            parts.append(soup.get_text("\n"))
    return EpubExtract(text="\n".join(parts))
