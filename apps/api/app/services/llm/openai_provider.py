from __future__ import annotations
from typing import Any
import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential
from ...settings import settings


def _is_retryable(exc: BaseException) -> bool:
    """Only retry on rate limits (429) and server errors (5xx)."""
    if isinstance(exc, RuntimeError):
        msg = str(exc)
        # Don't retry auth/permission errors
        if "error 401" in msg or "error 403" in msg:
            return False
        # Retry rate limits and server errors
        if "error 429" in msg or any(f"error {c}" in msg for c in range(500, 600)):
            return True
    return False


class OpenAIProvider:
    name = "openai"

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or settings.openai_api_key
        self.base_url = (base_url or settings.openai_base_url).rstrip("/")
        if not self.api_key:
            raise ValueError("OpenAI API key missing. Set COURSEGEN_OPENAI_API_KEY.")

    @retry(retry=retry_if_exception(_is_retryable), stop=stop_after_attempt(5), wait=wait_exponential(min=2, max=30))
    async def generate(self, *, system: str, user: str, json_schema: dict | None, params: dict) -> dict[str, Any]:
        model = params.get("model") or settings.openai_model
        temperature = float(params.get("temperature", 0.3))

        url = f"{self.base_url}/responses"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        payload: dict[str, Any] = {
            "model": model,
            "input": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
        }
        if json_schema:
            payload["text"] = {"format": {"type": "json_schema", "json_schema": {"name": "artifact", "schema": json_schema}}}

        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(url, headers=headers, json=payload)
            if r.status_code >= 400:
                raise RuntimeError(f"OpenAI error {r.status_code}: {r.text[:500]}")
            data = r.json()

        # Extract JSON if present
        # responses output can include output_text; json may be inside output[0].content
        # We'll try robustly.
        out_text = ""
        if "output_text" in data:
            out_text = data.get("output_text") or ""
        else:
            # try to stitch text
            try:
                for item in data.get("output", []):
                    for c in item.get("content", []):
                        if c.get("type") == "output_text":
                            out_text += c.get("text", "")
            except Exception:
                out_text = ""

        # If schema requested, attempt parse JSON from structured content
        if json_schema:
            # try: any content type 'output_json'
            try:
                for item in data.get("output", []):
                    for c in item.get("content", []):
                        if c.get("type") in ("output_json", "json"):
                            return c.get("json") or {}
            except Exception:
                pass
            # fallback: parse from out_text
            import json as _json
            try:
                return _json.loads(out_text)
            except Exception:
                return {"raw_text": out_text}

        return {"raw_text": out_text}
