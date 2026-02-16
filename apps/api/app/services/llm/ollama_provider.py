from __future__ import annotations
from typing import Any
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from ...settings import settings

class OllamaProvider:
    name = "ollama"

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate(self, *, system: str, user: str, json_schema: dict | None, params: dict) -> dict[str, Any]:
        model = params.get("model") or settings.ollama_model
        temperature = float(params.get("temperature", 0.3))

        # Ollama /api/chat
        url = f"{self.base_url}/api/chat"
        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "options": {"temperature": temperature},
            "stream": False,
        }

        # If schema requested, we still ask for strict JSON in prompt
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(url, json=payload)
            if r.status_code >= 400:
                raise RuntimeError(f"Ollama error {r.status_code}: {r.text[:500]}")
            data = r.json()

        content = data.get("message", {}).get("content", "") or ""
        if json_schema:
            import json as _json
            try:
                return _json.loads(content)
            except Exception:
                return {"raw_text": content}
        return {"raw_text": content}
