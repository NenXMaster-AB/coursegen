from __future__ import annotations
from typing import Protocol, Any

class LLMProvider(Protocol):
    name: str
    async def generate(self, *, system: str, user: str, json_schema: dict | None, params: dict) -> dict[str, Any]:
        ...
