# COURSEGEN ROADMAP — Codex Development Reference

## Vision
CourseGen is an AI‑powered learning engine that converts books into interactive courses with summaries, quizzes, labs, and adaptive tutoring.

---

## Current State (v0.1)
- FastAPI backend
- Next.js UI
- Redis queue
- Provider abstraction (OpenAI / Ollama)
- PDF/EPUB/TXT ingestion
- Chapter detection + chunking
- Artifact generation (summary, quiz, lab, takeaways)
- CLI support

---

## Phase Roadmap

### Phase 1 — Stabilization
- Improve chapter detection (font‑size + TOC parsing)
- Notebook (.ipynb) export improvements
- Artifact caching by hash
- Prompt refinement
- Error handling and retries
- UI polish (loading states, editing artifacts)

### Phase 2 — Intelligence Layer
- RAG over chapters
- Cross‑chapter synthesis
- Interactive tutor chat per chapter
- Difficulty calibration
- Concept extraction engine

### Phase 3 — Personalization
- User accounts
- Learning progress tracking
- Adaptive quizzes
- Memory of weak areas
- Flashcard generation + spaced repetition

### Phase 4 — Platform
- Multi‑user SaaS
- Teams / classrooms
- Analytics dashboards
- Public API
- Plugin ecosystem

### Phase 5 — Advanced / Research
- Knowledge graph generation
- Skill gap detection
- Curriculum planning AI
- Agentic learning workflows
- Voice tutor mode

---

## Advanced Feature Ideas
- “Explain this page” overlay
- Code execution sandbox
- Visual concept maps
- Dataset generator for ML books
- Anki sync
- Mobile companion app

---

## Architecture Evolution
- Vector database integration
- Event streaming architecture
- Worker orchestration scaling
- Plugin system for providers
- Hybrid local/cloud inference

---

## Security Roadmap
- Prompt injection mitigation
- Content sandboxing
- Rate limiting
- Model policy enforcement
- Audit logs

---

## Monetization Opportunities
- Developer learning SaaS
- Enterprise training platform
- Certification preparation
- AI tutor API
- Marketplace for course packs

---

## Long‑Term Direction
CourseGen evolves from a book‑to‑course generator into an AI learning infrastructure platform capable of powering education products, onboarding systems, and adaptive training environments.

