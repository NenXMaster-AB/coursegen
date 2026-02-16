from __future__ import annotations
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from rq import Queue
from redis import Redis
from ..db import get_db
from ..models import Book, Job
from ..schemas import GenerateRequest
from ..settings import settings

router = APIRouter(prefix="/generate", tags=["generate"])

def _queue() -> Queue:
    redis = Redis.from_url(settings.redis_url)
    return Queue("coursegen", connection=redis, default_timeout=3600)

@router.post("")
async def enqueue(req: GenerateRequest, db: AsyncSession = Depends(get_db)):
    # ensure book exists
    book = (await db.execute(select(Book).where(Book.id==req.book_id))).scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")

    q = _queue()
    job = q.enqueue(
        "app.workers.tasks.generate_job",
        req.model_dump(),
        job_timeout=3600,
        result_ttl=3600,
    )

    row = Job(
        id=job.id,
        status="queued",
        progress=0,
        message="Queued",
        payload=req.model_dump(),
        created_at=dt.datetime.utcnow(),
        updated_at=dt.datetime.utcnow(),
    )
    db.add(row)
    await db.commit()

    return {"job_id": job.id}
