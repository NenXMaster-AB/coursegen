from __future__ import annotations
import re
from dataclasses import dataclass
from .chunking import clean_text

@dataclass
class ChapterSpan:
    index: int
    title: str
    start: int
    end: int

_HEADING_PATTERNS = [
    re.compile(r"^(chapter\s+\d+\b.*)$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(\d+\.\s+[^\n]{3,})$", re.MULTILINE),
    re.compile(r"^(\d+\.\d+\s+[^\n]{3,})$", re.MULTILINE),
]

def chapterize(text: str, toc_titles: list[str] | None = None, min_chapter_chars: int = 2000) -> list[ChapterSpan]:
    text = clean_text(text)
    if len(text) < min_chapter_chars:
        return [ChapterSpan(index=1, title="Chapter 1", start=0, end=len(text))]

    # If TOC titles exist, try to find them in text in order (best-effort)
    if toc_titles:
        spans: list[ChapterSpan] = []
        pos = 0
        found_offsets: list[tuple[str,int]] = []
        for title in toc_titles:
            if not title or len(title) < 3:
                continue
            # fuzzy-ish: take first 40 chars, remove punctuation
            needle = re.sub(r"[^a-z0-9 ]+", "", title.lower())[:40].strip()
            if len(needle) < 6:
                continue
            hay = re.sub(r"[^a-z0-9\n ]+", "", text.lower())
            idx = hay.find(needle, pos)
            if idx != -1:
                found_offsets.append((title.strip(), idx))
                pos = idx + 1
        if len(found_offsets) >= 3:
            for i, (t, start) in enumerate(found_offsets, start=1):
                end = found_offsets[i][1] if i < len(found_offsets) else len(text)
                if end - start >= min_chapter_chars:
                    spans.append(ChapterSpan(index=i, title=t, start=start, end=end))
            if spans:
                return spans

    # Heuristic headings by regex
    candidates: list[tuple[int, str]] = []
    for pat in _HEADING_PATTERNS:
        for m in pat.finditer(text):
            title = m.group(1).strip()
            candidates.append((m.start(), title))
    candidates = sorted(set(candidates), key=lambda x: x[0])

    if len(candidates) < 2:
        return [ChapterSpan(index=1, title="Chapter 1", start=0, end=len(text))]

    spans: list[ChapterSpan] = []
    for i, (start, title) in enumerate(candidates, start=1):
        end = candidates[i][0] if i < len(candidates) else len(text)
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans)+1, title=title[:200], start=start, end=end))

    if not spans:
        return [ChapterSpan(index=1, title="Chapter 1", start=0, end=len(text))]

    return spans
