# CourseGen — Interactive Course Generator (PDF/EPUB/TXT → Summaries, Quizzes, Labs)

CourseGen ingests an e-book (PDF/EPUB/TXT/MD), detects chapters/sections, chunks text, and generates:
- **Summaries**
- **Quizzes** (MCQ + short answer + coding prompts)
- **Labs** (Markdown labs + optional notebook export JSON)
- **Key takeaways**

It ships with:
- **FastAPI** backend (SQLite)
- **RQ + Redis** job queue (background generation)
- **Provider-agnostic LLM layer** (OpenAI + Ollama example)
- **Next.js** web UI (interactive)
- **Python CLI** (power workflows)
- **Docker Compose** for local dev

> ⚠️ Treat book text as **untrusted input**. CourseGen prompts are designed so book text cannot override system instructions.

---

## Quickstart (Docker)

1) Create an `.env` file:

```bash
cp .env.example .env
# edit keys as needed
```

2) Run:

```bash
docker compose up --build
```

Open:
- Web UI: http://localhost:3000
- API: http://localhost:8000/docs

---

## Quickstart (Local Dev)

### Backend
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Worker
In another terminal:
```bash
cd apps/api
source .venv/bin/activate
rq worker coursegen --url redis://localhost:6379/0
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

---

## CLI

Install in editable mode:

```bash
cd packages/cli
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
```

Examples:

```bash
coursegen ingest ./mybook.pdf
coursegen books
coursegen chapters <BOOK_ID>
coursegen generate <BOOK_ID> --chapter 1 --summary --quiz --lab --takeaways
coursegen export <BOOK_ID> --chapter 1 --type summary --format md
```

---

## Notes

- PDF extraction uses **PyMuPDF** by default (fast). EPUB uses **ebooklib**.
- Chapter detection uses a simple heading heuristic + optional PDF TOC.
- Generation is map→reduce to stay within context limits.
- Artifacts are stored with versions; regenerations create new rows.

---

## Folder Layout

```
apps/api      FastAPI + DB + ingestion + generation + providers
apps/web      Next.js UI
packages/cli  Python CLI
docker-compose.yml
```

---

## License
MIT (adjust as needed)
