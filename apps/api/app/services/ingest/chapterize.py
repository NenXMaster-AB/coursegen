from __future__ import annotations
import bisect
import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

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

def _clean_title(title: str) -> str:
    t = title or ""
    # Remove common PDF garbage glyphs and control characters.
    t = t.replace("\u25a0", " ").replace("\u25a1", " ").replace("\ufffd", " ")
    t = re.sub(r"[\x00-\x09\x0b-\x1f\x7f]", "", t)  # strip control chars
    t = re.sub(r"\s+", " ", t).strip()
    # UI already shows chapter index badge, so strip heading number prefix.
    stripped = re.sub(r"(?i)^chapter[\s\W_]*\d+\s*[:\-.,]?\s*", "", t).strip()
    stripped = stripped.strip(" -:,.")
    # If stripping the prefix leaves nothing, keep "Chapter N" as the title.
    if stripped:
        return stripped[:200]
    return t[:200]

def _finalize_spans(spans: list[ChapterSpan], text_len: int, min_chapter_chars: int) -> list[ChapterSpan]:
    if not spans:
        return [ChapterSpan(index=1, title="Full Text", start=0, end=text_len)]

    # Sort by document position; for ties keep the larger span.
    spans = sorted(spans, key=lambda s: (s.start, -(s.end - s.start)))

    # Merge overlaps: keep the larger span when two overlap.
    merged: list[ChapterSpan] = []
    for s in spans:
        start = max(0, min(text_len, s.start))
        end = max(0, min(text_len, s.end))
        if end <= start:
            continue
        if merged and start < merged[-1].end:
            # Overlapping — keep whichever span is larger.
            prev = merged[-1]
            if (end - start) > (prev.end - prev.start):
                merged[-1] = ChapterSpan(index=0, title=s.title, start=start, end=end)
            continue
        merged.append(ChapterSpan(index=0, title=s.title, start=start, end=end))

    # Filter out spans below minimum size.
    filtered = [s for s in merged if (s.end - s.start) >= min_chapter_chars]

    if not filtered:
        return [ChapterSpan(index=1, title="Full Text", start=0, end=text_len)]

    # Number sequentially; clean titles, preserving originals.
    out: list[ChapterSpan] = []
    for i, s in enumerate(filtered, start=1):
        title = _clean_title(s.title) or s.title or f"Section {i}"
        out.append(ChapterSpan(index=i, title=title, start=s.start, end=s.end))
    return out

def _chapter_number(title: str) -> int | None:
    s = (title or "").replace("\u25a0", " ").replace("\u25a1", " ").replace("\ufffd", " ")
    m = re.search(r"\bchapter\b[\s\W_]{0,12}(\d{1,3})\b", s, flags=re.IGNORECASE)
    if not m:
        return None
    try:
        return int(m.group(1))
    except Exception:
        return None

def _norm_title(title: str) -> str:
    return re.sub(r"\s+", " ", (title or "").strip().casefold())

def _dedupe_toc_headings(headings: list[tuple[str, int]]) -> list[tuple[str, int]]:
    seen_keys: set[tuple[str, int]] = set()
    deduped: list[tuple[str, int]] = []
    for title, page in headings:
        key = (_norm_title(title), page)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append((title, page))

    # If entries look chapter-numbered, keep first occurrence per chapter number.
    nums = [_chapter_number(title) for (title, _) in deduped]
    uniq_nums = {n for n in nums if n is not None}
    if len(uniq_nums) >= 3:
        out: list[tuple[str, int]] = []
        seen_numbers: set[int] = set()
        for title, page in deduped:
            num = _chapter_number(title)
            if num is not None:
                if num in seen_numbers:
                    continue
                seen_numbers.add(num)
            out.append((title, page))
        deduped = out

    return deduped

def _build_spans_from_headings(
    text_len: int,
    headings: list[tuple[str, int]],
    page_offsets: list[int],
    min_chapter_chars: int,
) -> list[ChapterSpan]:
    starts: list[tuple[str, int]] = []
    last_start = -1
    for title, page in headings:
        start = page_offsets[page - 1]
        # TOC can map many rows to same destination; keep only strictly increasing starts.
        if start <= last_start:
            continue
        starts.append((title, start))
        last_start = start

    if len(starts) < 2:
        return []

    spans: list[ChapterSpan] = []
    for i, (title, start) in enumerate(starts, start=1):
        end = starts[i][1] if i < len(starts) else text_len
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans) + 1, title=title, start=start, end=end))
    return spans

def _toc_span_score(spans: list[ChapterSpan], text_len: int, level: int) -> tuple[float, int, int]:
    # Score by coverage first, then span count, then prefer shallower TOC level.
    covered = sum(max(0, s.end - s.start) for s in spans)
    coverage = (covered / text_len) if text_len > 0 else 0.0
    return (coverage, len(spans), -level)

def _spans_from_toc_pages(
    text: str,
    toc_entries: list[tuple[int, str, int]],
    page_offsets: list[int],
    min_chapter_chars: int,
) -> list[ChapterSpan]:
    if not toc_entries or not page_offsets:
        return []

    valid: list[tuple[int, str, int]] = []
    max_page = len(page_offsets)
    for lvl, title, page in toc_entries:
        if not title or not title.strip():
            continue
        if page < 1 or page > max_page:
            continue
        valid.append((lvl, title.strip(), page))
    if not valid:
        return []

    levels = sorted({lvl for (lvl, _, _) in valid})
    candidates: list[tuple[tuple[float, int, int], list[ChapterSpan]]] = []
    for level in levels:
        headings = [(title, page) for (lvl, title, page) in valid if lvl == level]
        headings.sort(key=lambda x: x[1])
        deduped = _dedupe_toc_headings(headings)
        spans = _build_spans_from_headings(len(text), deduped, page_offsets, min_chapter_chars)
        if len(spans) < 2:
            continue
        score = _toc_span_score(spans, len(text), level)
        candidates.append((score, spans))

    if not candidates:
        return []

    candidates.sort(key=lambda x: x[0], reverse=True)
    best = candidates[0][1]

    # Guardrail: reject implausible TOC segmentation (e.g., one giant span + tiny scraps).
    covered = sum(max(0, s.end - s.start) for s in best)
    coverage = covered / len(text) if len(text) > 0 else 0.0
    if len(best) < 2 or coverage < 0.5:
        return []
    return best

def _spans_from_toc_titles(text: str, toc_titles: list[str], min_chapter_chars: int) -> list[ChapterSpan]:
    # De-duplicate TOC labels first; repeated labels often come from noisy PDF outlines.
    ordered_titles: list[str] = []
    seen: set[str] = set()
    for raw in toc_titles:
        t = (raw or "").strip()
        if len(t) < 3:
            continue
        k = _norm_title(t)
        if k in seen:
            continue
        seen.add(k)
        ordered_titles.append(t)

    if len(ordered_titles) < 2:
        return []

    spans: list[ChapterSpan] = []
    pos = 0
    found_offsets: list[tuple[str, int]] = []
    for t in ordered_titles:
        # Keep text offsets stable by matching directly against original text.
        needle = t[:120]
        pattern = re.escape(needle).replace(r"\ ", r"\s+")
        m = re.search(pattern, text[pos:], flags=re.IGNORECASE)
        if not m:
            continue
        idx = pos + m.start()
        found_offsets.append((t, idx))
        pos = idx + 1

    if len(found_offsets) < 3:
        return []

    for i, (title, start) in enumerate(found_offsets, start=1):
        end = found_offsets[i][1] if i < len(found_offsets) else len(text)
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans) + 1, title=title, start=start, end=end))

    if len(spans) < 2:
        return []
    covered = sum(max(0, s.end - s.start) for s in spans)
    coverage = covered / len(text) if len(text) > 0 else 0.0
    if coverage < 0.5:
        return []
    return spans

def _extract_printed_toc(
    text: str,
    page_offsets: list[int] | None = None,
) -> list[tuple[str, int]]:
    """Parse a printed Table of Contents from early pages of the text.

    Handles multi-line formats where the page number is on a separate line:
        Chapter 1: Giving Computers the Ability to Learn from Data
         1
        Chapter 6: Learning Best Practices for Model Evaluation and
        Hyperparameter Tuning
         171
    """
    # Only scan front matter (first ~50 physical pages or 10% of text).
    if page_offsets and len(page_offsets) > 50:
        scan_end = page_offsets[50]
    else:
        scan_end = min(len(text), max(30000, len(text) // 10))

    lines = text[:scan_end].splitlines()
    entries: list[tuple[str, int]] = []
    seen_nums: set[int] = set()

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Match a line starting with "Chapter N:" (or similar separator).
        if not re.match(r"(?i)^chapter\s+\d+\s*[:\-–—.]", line):
            i += 1
            continue

        ch_num = _chapter_number(line)
        if ch_num is None or ch_num in seen_nums:
            i += 1
            continue

        title = line
        page_num = None

        # Look ahead up to 4 lines for title continuation and/or page number.
        j = i + 1
        while j < min(i + 5, len(lines)):
            next_line = lines[j].strip()
            if not next_line:
                j += 1
                continue
            # A line that is just a number → page number.
            if re.fullmatch(r"\d{1,4}", next_line):
                page_num = int(next_line)
                break
            # Title continuation: starts with a letter, is short, and not
            # a subsection entry (those typically contain • or ■ or start
            # with an indented lowercase phrase).
            if (re.match(r"[A-Za-z]", next_line)
                    and len(next_line) < 100
                    and "•" not in next_line
                    and "\u25a0" not in next_line):
                title = title + " " + next_line
                j += 1
                continue
            # Anything else (subsection, etc.) — stop.
            break

        if page_num is not None:
            title = re.sub(r"\s+", " ", title).strip()
            seen_nums.add(ch_num)
            entries.append((title, page_num))
            i = j + 1
        else:
            i += 1

    print(f"[chapterize] _extract_printed_toc: {len(entries)} entries found")
    for t, p in entries[:25]:
        print(f"  page={p:>4}: {t!r}")
    return entries


def _spans_from_printed_toc(
    text: str,
    entries: list[tuple[str, int]],
    page_offsets: list[int],
    min_chapter_chars: int,
) -> list[ChapterSpan]:
    """Build chapter spans by mapping printed page numbers to physical pages.

    Uses the first chapter's subtitle to calibrate the offset between
    printed page numbers and physical PDF pages, then maps all entries.
    """
    if len(entries) < 2 or not page_offsets:
        return []

    # Calibrate: find where the first chapter's subtitle appears in
    # the content (not the TOC listing). Use the LAST occurrence.
    first_title, first_printed_page = entries[0]
    subtitle = re.sub(r"(?i)^chapter\s+\d+\s*[:\-–—.]\s*", "", first_title).strip()
    if len(subtitle) < 10:
        return []

    needle = re.escape(subtitle[:80]).replace(r"\ ", r"\s+")
    last_match = None
    for m in re.finditer(needle, text, flags=re.IGNORECASE):
        last_match = m
    if last_match is None:
        print(f"[chapterize] printed_toc calibration: can't find {subtitle[:60]!r}")
        return []

    # Determine which physical page (0-based) this offset is on.
    content_offset = last_match.start()
    physical_page = bisect.bisect_right(page_offsets, content_offset) - 1
    if physical_page < 0:
        return []

    # Front matter = physical pages before printed page 1.
    front_matter_count = physical_page - (first_printed_page - 1)
    if front_matter_count < 0:
        front_matter_count = 0
    print(f"[chapterize] printed_toc calibration: subtitle at offset {content_offset}, "
          f"physical_page={physical_page}, front_matter={front_matter_count}")

    # Map all entries to character offsets via page_offsets.
    spans: list[ChapterSpan] = []
    for i, (title, printed_page) in enumerate(entries):
        phys = (printed_page - 1) + front_matter_count
        if phys < 0 or phys >= len(page_offsets):
            continue
        start = page_offsets[phys]
        if i + 1 < len(entries):
            next_phys = (entries[i + 1][1] - 1) + front_matter_count
            end = page_offsets[next_phys] if 0 <= next_phys < len(page_offsets) else len(text)
        else:
            end = len(text)
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans) + 1, title=title, start=start, end=end))

    if len(spans) < 2:
        return []
    covered = sum(s.end - s.start for s in spans)
    coverage = covered / len(text) if text else 0.0
    print(f"[chapterize] printed_toc spans: {len(spans)}, coverage={coverage:.1%}")
    if coverage < 0.5:
        return []
    return spans


def _is_near_page_top(offset: int, page_offsets: list[int] | None, max_chars_from_page_start: int = 1400) -> bool:
    if not page_offsets:
        return True
    i = bisect.bisect_right(page_offsets, offset) - 1
    if i < 0:
        return False
    return (offset - page_offsets[i]) <= max_chars_from_page_start

def _heading_candidates(
    text: str,
    *,
    page_offsets: list[int] | None = None,
    prefer_chapter_only: bool = False,
) -> list[tuple[int, str]]:
    # Prefer explicit "Chapter N" headings when available.
    chapter_hits: list[tuple[int, str, int | None]] = []
    # Allow leading garbage (glyphs, control chars, punctuation) before "Chapter".
    chapter_pattern = re.compile(
        r"^\W*(chapter\b[\s\W_]{0,12}\d+\b[^\n]*)$",
        re.IGNORECASE | re.MULTILINE,
    )
    for m in chapter_pattern.finditer(text):
        title = m.group(1).strip()
        if len(title) > 160:
            continue
        if not _is_near_page_top(m.start(), page_offsets):
            continue
        chapter_hits.append((m.start(), title, _chapter_number(title)))

    # Also capture two-line chapter headings:
    #   Chapter 7
    #   Advanced Optimization
    # and
    #   7
    #   Advanced Optimization
    lines = text.splitlines(keepends=True)
    offsets: list[int] = []
    cur = 0
    for line in lines:
        offsets.append(cur)
        cur += len(line)
    for i in range(len(lines) - 1):
        l1 = lines[i].strip()
        l2 = lines[i + 1].strip()
        # Strip garbage glyphs and control chars for matching.
        l1_clean = re.sub(r"[\x00-\x09\x0b-\x1f\x7f\u25a0\u25a1\ufffd]", "", l1).strip()
        l2_clean = re.sub(r"[\x00-\x09\x0b-\x1f\x7f\u25a0\u25a1\ufffd]", "", l2).strip()
        if len(l2_clean) < 3 or len(l2_clean) > 180:
            continue
        if not _is_near_page_top(offsets[i], page_offsets):
            continue
        if re.fullmatch(r"chapter\s+\d+", l1_clean, flags=re.IGNORECASE):
            title = f"{l1_clean} {l2_clean}"
            chapter_hits.append((offsets[i], title, _chapter_number(l1_clean)))
        elif (re.fullmatch(r"\d{1,2}", l1_clean)
              and 1 <= int(l1_clean) <= 60
              and len(l2_clean) <= 80
              and re.match(r"[A-Za-z][^\n]{2,}", l2_clean)):
            title = f"Chapter {l1_clean} {l2_clean}"
            chapter_hits.append((offsets[i], title, int(l1_clean)))

    if len(chapter_hits) >= 2:
        chapter_hits.sort(key=lambda x: x[0])

        # Keep sensible chapter numbers only.
        chapter_hits = [h for h in chapter_hits if h[2] is None or (1 <= h[2] <= 60)]
        if len(chapter_hits) < 2:
            return []

        # If we see Chapter 1, ignore any preface/TOC noise before it.
        first_one = next((i for i, h in enumerate(chapter_hits) if h[2] == 1), None)
        if first_one is not None and first_one > 0:
            chapter_hits = chapter_hits[first_one:]

        # If TOC-like sequence appears first (e.g., 1..N then reset to 1), drop the prefix.
        reset_at = None
        for i in range(1, len(chapter_hits)):
            prev_num = chapter_hits[i - 1][2]
            cur_num = chapter_hits[i][2]
            if prev_num is not None and cur_num is not None and cur_num < prev_num:
                reset_at = i
                break
        if reset_at is not None and reset_at >= 2:
            chapter_hits = chapter_hits[reset_at:]

        # Drop repeated page-header matches for the same chapter number/title.
        filtered: list[tuple[int, str]] = []
        seen_numbers: set[int] = set()
        seen_titles: set[str] = set()
        prev_num: int | None = None
        for start, title, num in chapter_hits:
            norm_title = re.sub(r"\s+", " ", title.casefold()).strip()
            if num is not None and num in seen_numbers:
                continue
            if norm_title in seen_titles:
                continue
            if prev_num is not None and num is not None and num < prev_num:
                continue
            if prev_num is not None and num is not None and (num - prev_num) > 8:
                continue
            if num is not None:
                seen_numbers.add(num)
                prev_num = num
            seen_titles.add(norm_title)
            filtered.append((start, title))
        if len(filtered) >= 2:
            return filtered

    if prefer_chapter_only:
        return []

    # Fallback: numbered section headings only when explicit chapter headings are absent.
    section_hits: list[tuple[int, str]] = []
    for pat in _HEADING_PATTERNS[1:]:
        for m in pat.finditer(text):
            if not _is_near_page_top(m.start(), page_offsets):
                continue
            section_hits.append((m.start(), m.group(1).strip()))
    # Common heading format: "1 Introduction" (no dot).
    for m in re.finditer(r"^\s*(\d{1,2}\s+[A-Z][^\n]{3,120})$", text, flags=re.MULTILINE):
        if not _is_near_page_top(m.start(), page_offsets):
            continue
        section_hits.append((m.start(), m.group(1).strip()))
    return sorted(set(section_hits), key=lambda x: x[0])

def _fallback_page_splits(text: str, page_offsets: list[int], min_chapter_chars: int) -> list[ChapterSpan]:
    if not page_offsets or len(page_offsets) < 8:
        return []
    if len(text) < min_chapter_chars * 8:
        return []

    page_count = len(page_offsets)
    # Keep section count bounded for usability.
    target_sections = max(6, min(20, page_count // 20))
    if target_sections < 2:
        return []
    step = max(1, page_count // target_sections)
    starts = [page_offsets[i] for i in range(0, page_count, step)]
    if not starts or starts[0] != 0:
        starts.insert(0, 0)
    if starts[-1] >= len(text):
        starts = starts[:-1]
    if len(starts) < 2:
        return []

    spans: list[ChapterSpan] = []
    for i, start in enumerate(starts, start=1):
        end = starts[i] if i < len(starts) else len(text)
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans) + 1, title=f"Section {len(spans) + 1}", start=start, end=end))
    return spans if len(spans) >= 2 else []

def chapterize(
    text: str,
    toc_titles: list[str] | None = None,
    toc_entries: list[tuple[int, str, int]] | None = None,
    page_offsets: list[int] | None = None,
    min_chapter_chars: int = 2000,
) -> list[ChapterSpan]:
    print(f"[chapterize] text_len={len(text)}, toc_entries={len(toc_entries or [])}, "
          f"page_offsets={len(page_offsets or [])}")

    # Best source for PDF chapter boundaries: TOC page numbers.
    if toc_entries and page_offsets:
        spans = _spans_from_toc_pages(text, toc_entries, page_offsets, min_chapter_chars)
        print(f"[chapterize] toc_pages path: {len(spans)} spans")
        if spans:
            result = _finalize_spans(spans, len(text), min_chapter_chars)
            print(f"[chapterize] toc_pages finalized: {len(result)} chapters")
            for s in result:
                print(f"  ch{s.index}: {s.title!r} ({s.start}-{s.end})")
            return result
        else:
            print("[chapterize] toc_pages path produced 0 usable spans, falling through")

    if len(text) < min_chapter_chars:
        return [ChapterSpan(index=1, title="Section 1", start=0, end=len(text))]

    # If TOC titles exist (from embedded bookmarks), try to find them in text.
    if toc_titles:
        spans = _spans_from_toc_titles(text, toc_titles, min_chapter_chars)
        print(f"[chapterize] toc_titles path: {len(spans)} spans")
        if spans:
            result = _finalize_spans(spans, len(text), min_chapter_chars)
            print(f"[chapterize] toc_titles finalized: {len(result)} chapters")
            return result

    # Try parsing a printed Table of Contents from the front matter.
    if page_offsets:
        printed_entries = _extract_printed_toc(text, page_offsets)
        if len(printed_entries) >= 2:
            spans = _spans_from_printed_toc(text, printed_entries, page_offsets, min_chapter_chars)
            if spans:
                result = _finalize_spans(spans, len(text), min_chapter_chars)
                print(f"[chapterize] printed_toc finalized: {len(result)} chapters")
                for s in result:
                    print(f"  ch{s.index}: {s.title!r} ({s.start}-{s.end})")
                return result

    # Heuristic headings by regex
    candidates = _heading_candidates(
        text,
        page_offsets=page_offsets,
        prefer_chapter_only=bool(page_offsets),
    )
    print(f"[chapterize] heading_candidates: {len(candidates)} found")
    for c in candidates[:30]:
        print(f"  offset={c[0]}: {c[1][:80]!r}")

    if len(candidates) < 2:
        if page_offsets:
            fallback = _fallback_page_splits(text, page_offsets, min_chapter_chars)
            if fallback:
                return _finalize_spans(fallback, len(text), min_chapter_chars)
        return [ChapterSpan(index=1, title="Section 1", start=0, end=len(text))]

    spans: list[ChapterSpan] = []
    for i, (start, title) in enumerate(candidates, start=1):
        end = candidates[i][0] if i < len(candidates) else len(text)
        if end - start < min_chapter_chars:
            continue
        spans.append(ChapterSpan(index=len(spans)+1, title=title, start=start, end=end))

    if not spans:
        if page_offsets:
            fallback = _fallback_page_splits(text, page_offsets, min_chapter_chars)
            if fallback:
                return _finalize_spans(fallback, len(text), min_chapter_chars)
        return [ChapterSpan(index=1, title="Section 1", start=0, end=len(text))]

    return _finalize_spans(spans, len(text), min_chapter_chars)
