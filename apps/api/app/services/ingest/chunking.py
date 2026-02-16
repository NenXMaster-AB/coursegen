from __future__ import annotations
import re

def clean_text(t: str) -> str:
    t = t.replace("\x00", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def chunk_text(text: str, max_chars: int = 6000, overlap: int = 400) -> list[str]:
    text = clean_text(text)
    if not text:
        return []
    chunks: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        j = min(n, i + max_chars)
        # try to break on paragraph boundary
        cut = text.rfind("\n\n", i, j)
        if cut == -1 or cut < i + max_chars * 0.5:
            cut = j
        chunk = text[i:cut].strip()
        if chunk:
            chunks.append(chunk)
        i = max(i + 1, cut - overlap)
    return chunks
