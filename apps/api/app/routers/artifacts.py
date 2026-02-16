from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models import Chapter, Artifact
from ..schemas import ArtifactOut

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.get("/by-chapter/{chapter_id}", response_model=list[ArtifactOut])
async def list_by_chapter(chapter_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Artifact).where(Artifact.chapter_id==chapter_id).order_by(Artifact.type.asc(), Artifact.version.desc())
    )
    return res.scalars().all()

@router.get("/{artifact_id}", response_model=ArtifactOut)
async def get_artifact(artifact_id: int, db: AsyncSession = Depends(get_db)):
    art = (await db.execute(select(Artifact).where(Artifact.id==artifact_id))).scalar_one_or_none()
    if not art:
        raise HTTPException(404, "Artifact not found")
    return art

@router.get("/{artifact_id}/export")
async def export_artifact(artifact_id: int, fmt: str = Query("md", pattern="^(md|json)$"), db: AsyncSession = Depends(get_db)):
    art = (await db.execute(select(Artifact).where(Artifact.id==artifact_id))).scalar_one_or_none()
    if not art:
        raise HTTPException(404, "Artifact not found")
    if fmt == "md":
        return {"filename": f"{art.type}_v{art.version}.md", "content": art.content_md}
    return {"filename": f"{art.type}_v{art.version}.json", "content": art.content_json}
