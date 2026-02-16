from __future__ import annotations
from fastapi import APIRouter
from ..settings import settings

router = APIRouter(prefix="/providers", tags=["providers"])

@router.get("")
async def list_providers():
    return {
        "default_provider": settings.llm_provider,
        "providers": [
            {"id": "openai", "models": [settings.openai_model]},
            {"id": "ollama", "models": [settings.ollama_model]},
        ],
    }
