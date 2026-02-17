import type {
  Book,
  Chapter,
  ChapterPreview,
  Artifact,
  Job,
  GenerateRequest,
  GenerateResponse,
  ProvidersResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json();
}

// ─── Books ───

export function getBooks(signal?: AbortSignal): Promise<Book[]> {
  return request<Book[]>("/books", undefined, signal);
}

export function ingestBook(form: FormData, signal?: AbortSignal): Promise<Book> {
  return request<Book>("/books/ingest", { method: "POST", body: form }, signal);
}

// ─── Chapters ───

export function getChapters(bookId: number, signal?: AbortSignal): Promise<Chapter[]> {
  return request<Chapter[]>(`/chapters/by-book/${bookId}`, undefined, signal);
}

export function getChapterPreview(chapterId: number, signal?: AbortSignal): Promise<ChapterPreview> {
  return request<ChapterPreview>(`/chapters/${chapterId}/preview`, undefined, signal);
}

// ─── Artifacts ───

export function getArtifacts(chapterId: number, signal?: AbortSignal): Promise<Artifact[]> {
  return request<Artifact[]>(`/artifacts/by-chapter/${chapterId}`, undefined, signal);
}

export function getArtifact(artifactId: number, signal?: AbortSignal): Promise<Artifact> {
  return request<Artifact>(`/artifacts/${artifactId}`, undefined, signal);
}

// ─── Generation ───

export function generate(body: GenerateRequest, signal?: AbortSignal): Promise<GenerateResponse> {
  return request<GenerateResponse>(
    "/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    signal,
  );
}

// ─── Jobs ───

export function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  return request<Job>(`/jobs/${jobId}`, undefined, signal);
}

// ─── Providers ───

export function getProviders(signal?: AbortSignal): Promise<ProvidersResponse> {
  return request<ProvidersResponse>("/providers", undefined, signal);
}
