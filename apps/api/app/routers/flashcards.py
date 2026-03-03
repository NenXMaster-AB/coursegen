from __future__ import annotations
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..db import get_db
from ..models import Artifact, FlashcardReview, Chapter
from ..schemas import FlashcardReviewOut, ReviewSubmission, DeckStatsOut
from ..services.srs.sm2 import sm2

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


async def _get_artifact_cards(artifact_id: int, db: AsyncSession) -> tuple[Artifact, list[dict]]:
    art = (await db.execute(select(Artifact).where(Artifact.id == artifact_id))).scalar_one_or_none()
    if not art:
        raise HTTPException(404, "Artifact not found")
    if art.type != "flashcards":
        raise HTTPException(400, "Artifact is not a flashcards type")
    cards = (art.content_json or {}).get("cards") or []
    return art, cards


async def _ensure_reviews(artifact_id: int, card_count: int, db: AsyncSession) -> None:
    """Lazy-init FlashcardReview rows for all cards that don't have one yet."""
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert

    missing = []
    existing = (await db.execute(
        select(FlashcardReview.card_index).where(FlashcardReview.artifact_id == artifact_id)
    )).scalars().all()
    existing_set = set(existing)
    missing = [i for i in range(card_count) if i not in existing_set]
    if not missing:
        return

    stmt = sqlite_insert(FlashcardReview.__table__).values([
        {
            "artifact_id": artifact_id,
            "card_index": i,
            "ease_factor": 2.5,
            "interval": 0,
            "repetitions": 0,
            "next_review": dt.datetime.utcnow(),
            "last_review": None,
        }
        for i in missing
    ]).on_conflict_do_nothing()
    await db.execute(stmt)
    await db.commit()


@router.get("/{artifact_id}/session", response_model=list[FlashcardReviewOut])
async def get_session(artifact_id: int, db: AsyncSession = Depends(get_db)):
    """Get due cards for review (next_review <= now)."""
    _, cards = await _get_artifact_cards(artifact_id, db)
    await _ensure_reviews(artifact_id, len(cards), db)

    now = dt.datetime.utcnow()
    rows = (await db.execute(
        select(FlashcardReview)
        .where(FlashcardReview.artifact_id == artifact_id, FlashcardReview.next_review <= now)
        .order_by(FlashcardReview.next_review.asc())
    )).scalars().all()
    return rows


@router.post("/{artifact_id}/review", response_model=FlashcardReviewOut)
async def submit_review(artifact_id: int, body: ReviewSubmission, db: AsyncSession = Depends(get_db)):
    """Submit a rating for a card, update SM-2 state."""
    _, cards = await _get_artifact_cards(artifact_id, db)
    if body.card_index < 0 or body.card_index >= len(cards):
        raise HTTPException(400, "Invalid card_index")

    await _ensure_reviews(artifact_id, len(cards), db)

    rev = (await db.execute(
        select(FlashcardReview).where(
            FlashcardReview.artifact_id == artifact_id,
            FlashcardReview.card_index == body.card_index,
        )
    )).scalar_one()

    result = sm2(body.quality, rev.ease_factor, rev.interval, rev.repetitions)
    rev.ease_factor = result.ease_factor
    rev.interval = result.interval
    rev.repetitions = result.repetitions
    rev.next_review = result.next_review
    rev.last_review = dt.datetime.utcnow()
    await db.commit()
    await db.refresh(rev)
    return rev


@router.get("/{artifact_id}/stats", response_model=DeckStatsOut)
async def get_stats(artifact_id: int, db: AsyncSession = Depends(get_db)):
    """Deck statistics."""
    _, cards = await _get_artifact_cards(artifact_id, db)
    await _ensure_reviews(artifact_id, len(cards), db)

    rows = (await db.execute(
        select(FlashcardReview).where(FlashcardReview.artifact_id == artifact_id)
    )).scalars().all()

    now = dt.datetime.utcnow()
    due_now = sum(1 for r in rows if r.next_review <= now)
    learning = sum(1 for r in rows if r.repetitions > 0 and r.interval < 21)
    mature = sum(1 for r in rows if r.interval >= 21)
    avg_ease = sum(r.ease_factor for r in rows) / len(rows) if rows else 2.5

    return DeckStatsOut(
        total_cards=len(rows),
        due_now=due_now,
        learning=learning,
        mature=mature,
        average_ease=round(avg_ease, 2),
    )


@router.get("/{artifact_id}/export-anki")
async def export_anki(artifact_id: int, db: AsyncSession = Depends(get_db)):
    """Download an Anki .apkg deck."""
    art, cards = await _get_artifact_cards(artifact_id, db)
    if not cards:
        raise HTTPException(400, "No cards to export")

    import genanki
    import tempfile
    import os

    model = genanki.Model(
        1607392319,
        "CourseGen Flashcard",
        fields=[{"name": "Front"}, {"name": "Back"}, {"name": "Tags"}],
        templates=[{
            "name": "Card 1",
            "qfmt": "{{Front}}",
            "afmt": '{{FrontSide}}<hr id="answer">{{Back}}',
        }],
    )

    chapter_title = ""
    ch = (await db.execute(select(Chapter).where(Chapter.id == art.chapter_id))).scalar_one_or_none()
    if ch:
        chapter_title = ch.title
    deck_name = f"CourseGen::{chapter_title}" if chapter_title else "CourseGen::Flashcards"
    deck = genanki.Deck(abs(hash(deck_name)) % (2**31), deck_name)

    for card in cards:
        raw_tags = card.get("tags") or []
        # Anki tags cannot contain spaces — replace with underscores
        safe_tags = [t.replace(" ", "_") for t in raw_tags]
        note = genanki.Note(
            model=model,
            fields=[card.get("front", ""), card.get("back", ""), ", ".join(raw_tags)],
            tags=safe_tags,
        )
        deck.add_note(note)

    with tempfile.NamedTemporaryFile(suffix=".apkg", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        genanki.Package(deck).write_to_file(tmp_path)
        with open(tmp_path, "rb") as f:
            content = f.read()
    finally:
        os.unlink(tmp_path)

    filename = f"flashcards_{artifact_id}.apkg"
    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
