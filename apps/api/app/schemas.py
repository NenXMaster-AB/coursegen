from pydantic import BaseModel, Field
import datetime as dt
from typing import Literal, Any

ArtifactType = Literal["summary", "quiz", "lab", "takeaways", "flashcards"]

class BookOut(BaseModel):
    id: int
    title: str
    author: str | None
    source_type: str
    created_at: dt.datetime

class ImageOut(BaseModel):
    id: int
    url: str
    mime_type: str
    width: int
    height: int

class ChapterOut(BaseModel):
    id: int
    book_id: int
    index: int
    title: str
    word_count: int
    images: list[ImageOut] = []

class ArtifactOut(BaseModel):
    id: int
    chapter_id: int
    type: ArtifactType
    content_md: str
    content_json: dict
    provider: str
    model: str
    params_hash: str
    version: int
    created_at: dt.datetime

class GenerateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    book_id: int
    chapter_index: int = Field(..., ge=1)
    outputs: list[ArtifactType]
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    tone: Literal["tutor", "socratic", "concise"] = "tutor"
    length: Literal["short", "medium", "long"] = "medium"
    include_code: bool = True
    provider_name: str | None = Field(None, alias="provider")
    model: str | None = None
    temperature: float = 0.3

class FlashcardReviewOut(BaseModel):
    card_index: int
    ease_factor: float
    interval: int
    repetitions: int
    next_review: dt.datetime
    last_review: dt.datetime | None

class ReviewSubmission(BaseModel):
    card_index: int
    quality: int = Field(..., ge=0, le=5)

class DeckStatsOut(BaseModel):
    total_cards: int
    due_now: int
    learning: int
    mature: int
    average_ease: float
    next_review_at: dt.datetime | None = None

class JobOut(BaseModel):
    id: str
    status: str
    progress: int
    message: str | None
    payload: dict[str, Any]
    created_at: dt.datetime
    updated_at: dt.datetime
