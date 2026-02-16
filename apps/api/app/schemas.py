from pydantic import BaseModel, Field
import datetime as dt
from typing import Literal, Any

ArtifactType = Literal["summary", "quiz", "lab", "takeaways"]

class BookOut(BaseModel):
    id: int
    title: str
    author: str | None
    source_type: str
    created_at: dt.datetime

class ChapterOut(BaseModel):
    id: int
    book_id: int
    index: int
    title: str
    word_count: int

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
    book_id: int
    chapter_index: int = Field(..., ge=1)
    outputs: list[ArtifactType]
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    tone: Literal["tutor", "socratic", "concise"] = "tutor"
    length: Literal["short", "medium", "long"] = "medium"
    include_code: bool = True
    provider: str | None = None
    model: str | None = None
    temperature: float = 0.3

class JobOut(BaseModel):
    id: str
    status: str
    progress: int
    message: str | None
    payload: dict[str, Any]
    created_at: dt.datetime
    updated_at: dt.datetime
