from __future__ import annotations
import asyncio, datetime as dt
from sqlalchemy import select, update
from redis import Redis
from rq import get_current_job

from ..settings import settings
from ..db import SessionLocal
from ..models import Job
from ..services.generate.engine import generate_artifacts

def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)

async def _update_job(job_id: str, *, status: str | None = None, progress: int | None = None, message: str | None = None):
    async with SessionLocal() as session:
        row = (await session.execute(select(Job).where(Job.id==job_id))).scalar_one_or_none()
        if not row:
            return
        if status is not None:
            row.status = status
        if progress is not None:
            row.progress = progress
        if message is not None:
            row.message = message[:512]
        row.updated_at = dt.datetime.utcnow()
        await session.commit()

def generate_job(payload: dict):
    rq_job = get_current_job()
    job_id = rq_job.id if rq_job else payload.get("job_id") or "unknown"

    def progress_cb(pct: int, msg: str):
        _run(_update_job(job_id, progress=pct, message=msg, status="started"))

    try:
        _run(_update_job(job_id, status="started", progress=1, message="Starting"))
        async def _do():
            async with SessionLocal() as session:
                await generate_artifacts(session, progress_cb=progress_cb, **payload)
        _run(_do())
        _run(_update_job(job_id, status="finished", progress=100, message="Done"))
        return {"ok": True}
    except Exception as e:
        _run(_update_job(job_id, status="failed", message=f"Failed: {type(e).__name__}: {str(e)}"))
        raise
