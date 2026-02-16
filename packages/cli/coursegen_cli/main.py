import os
import typer
import requests
from rich import print

app = typer.Typer(help="CourseGen CLI")

API_BASE = os.environ.get("COURSEGEN_API_BASE", "http://localhost:8000")

@app.command()
def ingest(path: str, title: str = "", author: str = ""):
    """Ingest a book file (PDF/EPUB/TXT/MD)."""
    if not os.path.exists(path):
        raise typer.BadParameter("File not found")
    files = {"file": open(path, "rb")}
    data = {}
    if title: data["title"] = title
    if author: data["author"] = author
    r = requests.post(f"{API_BASE}/books/ingest", files=files, data=data, timeout=600)
    if r.status_code >= 400:
        raise typer.Exit(r.text)
    print(r.json())

@app.command()
def books():
    """List books."""
    r = requests.get(f"{API_BASE}/books", timeout=60)
    print(r.json())

@app.command()
def chapters(book_id: int):
    """List chapters for a book."""
    r = requests.get(f"{API_BASE}/chapters/by-book/{book_id}", timeout=60)
    print(r.json())

@app.command()
def generate(book_id: int, chapter: int, summary: bool = True, quiz: bool = False, lab: bool = False, takeaways: bool = True,
             difficulty: str = "intermediate", tone: str = "tutor", length: str = "medium",
             provider: str = "", model: str = "", temperature: float = 0.3):
    """Enqueue generation job for a chapter."""
    outputs = []
    if summary: outputs.append("summary")
    if quiz: outputs.append("quiz")
    if lab: outputs.append("lab")
    if takeaways: outputs.append("takeaways")

    payload = {
        "book_id": book_id,
        "chapter_index": chapter,
        "outputs": outputs,
        "difficulty": difficulty,
        "tone": tone,
        "length": length,
        "include_code": True,
        "temperature": temperature,
    }
    if provider: payload["provider"] = provider
    if model: payload["model"] = model

    r = requests.post(f"{API_BASE}/generate", json=payload, timeout=60)
    if r.status_code >= 400:
        raise typer.Exit(r.text)
    print(r.json())

@app.command()
def artifacts(chapter_id: int):
    """List artifacts for a chapter."""
    r = requests.get(f"{API_BASE}/artifacts/by-chapter/{chapter_id}", timeout=60)
    print(r.json())

@app.command()
def export(artifact_id: int, fmt: str = "md"):
    """Export an artifact (md/json)."""
    r = requests.get(f"{API_BASE}/artifacts/{artifact_id}/export?fmt={fmt}", timeout=60)
    if r.status_code >= 400:
        raise typer.Exit(r.text)
    data = r.json()
    fname = data.get("filename", f"artifact.{fmt}")
    content = data.get("content")
    if fmt == "json":
        import json as _json
        with open(fname, "w", encoding="utf-8") as f:
            _json.dump(content, f, indent=2)
    else:
        with open(fname, "w", encoding="utf-8") as f:
            f.write(content or "")
    print(f"Wrote {fname}")

if __name__ == "__main__":
    app()
