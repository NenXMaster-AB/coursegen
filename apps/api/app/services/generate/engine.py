from __future__ import annotations
import hashlib, json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..llm.openai_provider import OpenAIProvider
from ..llm.ollama_provider import OllamaProvider
from ...settings import settings
from ...models import Chapter, Chunk, Artifact
from .prompts import map_prompt, reduce_prompt
from .render import to_markdown

def _hash_params(d: dict) -> str:
    s = json.dumps(d, sort_keys=True)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:32]

def _provider(provider_name: str):
    if provider_name == "openai":
        return OpenAIProvider()
    if provider_name == "ollama":
        return OllamaProvider()
    raise ValueError(f"Unknown provider: {provider_name}")

async def generate_artifacts(
    session: AsyncSession,
    *,
    book_id: int,
    chapter_index: int,
    outputs: list[str],
    difficulty: str,
    tone: str,
    length: str,
    include_code: bool,
    provider_name: str | None,
    model: str | None,
    temperature: float,
    progress_cb=None,
) -> list[int]:
    provider_name = provider_name or settings.llm_provider
    provider = _provider(provider_name)

    ch = (await session.execute(
        select(Chapter).where(Chapter.book_id==book_id, Chapter.index==chapter_index)
    )).scalar_one()

    chunks = (await session.execute(
        select(Chunk).where(Chunk.chapter_id==ch.id).order_by(Chunk.chunk_index.asc())
    )).scalars().all()

    created_ids: list[int] = []
    total_steps = max(1, len(chunks) + len(outputs))
    done = 0

    # Map: notes for each chunk
    notes: list[dict] = []
    for c in chunks:
        sys, usr = map_prompt(c.text)
        out = await provider.generate(
            system=sys,
            user=usr,
            json_schema=None,  # keep provider-agnostic; map returns JSON by instruction
            params={"model": model, "temperature": temperature},
        )
        # best-effort json parse
        if "raw_text" in out and isinstance(out["raw_text"], str):
            try:
                notes.append(json.loads(out["raw_text"]))
            except Exception:
                notes.append({"important_points":[out["raw_text"]], "concepts":[], "definitions":[], "examples":[], "pitfalls":[]})
        else:
            notes.append(out)

        done += 1
        if progress_cb:
            progress_cb(int(done/total_steps*100), f"Mapped chunk {c.chunk_index}/{len(chunks)}")

    # Reduce: each artifact
    for artifact_type in outputs:
        params = {
            "difficulty": difficulty,
            "tone": tone,
            "length": length,
            "include_code": include_code,
            "provider": provider_name,
            "model": model or "",
            "temperature": temperature,
            "artifact_type": artifact_type,
        }
        params_hash = _hash_params(params)

        sys, usr = reduce_prompt(artifact_type, notes, difficulty=difficulty, tone=tone, length=length, include_code=include_code)
        out = await provider.generate(
            system=sys,
            user=usr + "\n\nReturn JSON only.",
            json_schema=None,
            params={"model": model, "temperature": temperature},
        )

        if "raw_text" in out and isinstance(out["raw_text"], str):
            try:
                data = json.loads(out["raw_text"])
            except Exception:
                data = {"raw_text": out["raw_text"]}
        else:
            data = out

        md = to_markdown(artifact_type if artifact_type!="takeaways" else "takeaways", data)

        # versioning
        existing_versions = (await session.execute(
            select(Artifact.version).where(Artifact.chapter_id==ch.id, Artifact.type==artifact_type).order_by(Artifact.version.desc())
        )).scalars().all()
        version = (existing_versions[0] + 1) if existing_versions else 1

        art = Artifact(
            chapter_id=ch.id,
            type=artifact_type,
            content_md=md,
            content_json=data,
            provider=provider_name,
            model=model or "",
            params_hash=params_hash,
            version=version,
        )
        session.add(art)
        await session.flush()
        created_ids.append(art.id)

        done += 1
        if progress_cb:
            progress_cb(int(done/total_steps*100), f"Generated {artifact_type}")

    await session.commit()
    return created_ids
