# Repository Guidelines

## Project Structure & Module Organization
CourseGen is a small monorepo with three main packages:
- `apps/api`: FastAPI backend, SQLAlchemy models, ingestion/generation services, and RQ worker tasks.
- `apps/web`: Next.js App Router frontend (`app/`, `components/`, `lib/`).
- `packages/cli`: Typer-based Python CLI (`coursegen_cli/`).
- Root files: `docker-compose.yml`, `.env.example`, `README.md`.

Keep feature logic near its runtime: API routes in `apps/api/app/routers`, LLM/ingestion services in `apps/api/app/services`, and UI modules as focused React components in `apps/web/components`.

## Build, Test, and Development Commands
- `docker compose up --build`: start Redis, API, worker, and web app for full local stack.
- `cd apps/api && uvicorn app.main:app --reload --port 8000`: run backend in dev mode.
- `cd apps/api && rq worker coursegen --url redis://localhost:6379/0`: run background job worker.
- `cd apps/web && npm install && npm run dev`: run frontend on `localhost:3000`.
- `cd apps/web && npm run build && npm run start`: production web build/run.
- `cd apps/web && npm run lint`: run Next.js lint checks.

## Coding Style & Naming Conventions
- Python: 4-space indentation, type hints where practical, `snake_case` for functions/modules, `PascalCase` for classes.
- TypeScript/React: follow existing component style; component files use `PascalCase` (for example `GenerationControls.tsx`), helpers use concise `camelCase`.
- Keep API schemas and payload fields stable (`snake_case`) to match backend contracts.

## Testing Guidelines
There are currently no committed automated test suites in this snapshot. For new work:
- Add backend tests under `apps/api/tests` (pytest-style).
- Add frontend tests under `apps/web/__tests__` or `*.test.tsx`.
- At minimum, run manual smoke checks: upload a book, select a chapter, queue generation, and verify artifact output in UI and `/docs` endpoints.

## Commit & Pull Request Guidelines
Git history is not available in this checkout, so follow this project convention:
- Commit format: `type(scope): imperative summary` (for example `feat(api): add provider health endpoint`).
- Keep commits focused and reversible.
- PRs should include: purpose, key changes, local verification steps, linked issue/task, and screenshots for UI changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets.
- Treat ingested book content as untrusted input.
- Prefer environment variables (`COURSEGEN_*`, `NEXT_PUBLIC_API_BASE_URL`) over hardcoded credentials or URLs.
