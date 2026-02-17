// ─── Domain Models ───

export interface Book {
  id: number;
  title: string;
  author: string | null;
  source_type: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  index: number;
  title: string;
  word_count: number;
}

export interface ChapterPreview {
  chapter_id: number;
  title: string;
  preview: string;
}

export type ArtifactType = "summary" | "quiz" | "lab" | "takeaways";

export interface Artifact {
  id: number;
  chapter_id: number;
  type: ArtifactType;
  content_md: string;
  content_json: SummaryContent | QuizContent | LabContent | TakeawaysContent;
  provider: string;
  model: string;
  params_hash: string;
  version: number;
  created_at: string;
}

// ─── Artifact Content JSON ───

export interface SummaryContent {
  overview: string;
  concepts: string[];
  terms: Term[];
  pitfalls: string[];
  key_takeaways: string[];
}

export interface Term {
  term: string;
  definition: string;
}

export interface QuizContent {
  mcq: MCQuestion[];
  short_answer: ShortAnswerQuestion[];
  coding: CodingQuestion[];
}

export interface MCQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface ShortAnswerQuestion {
  question: string;
  answer: string;
}

export interface CodingQuestion {
  prompt: string;
  constraints: string[];
  solution_outline: string[];
  tests: string[];
}

export interface LabContent {
  objective: string;
  prereqs: string[];
  steps: string[];
  deliverables: string[];
  stretch_goals: string[];
  rubric: string[];
  notebook_cells: NotebookCell[];
}

export interface NotebookCell {
  cell_type: "markdown" | "code";
  source: string;
}

export interface TakeawaysContent {
  top_takeaways: string[];
  common_mistakes: string[];
  when_to_use: string[];
  when_not_to_use: string[];
}

// ─── Job ───

export type JobStatus = "queued" | "started" | "finished" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── API Request / Response ───

export interface GenerateRequest {
  book_id: number;
  chapter_index: number;
  outputs: ArtifactType[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  tone?: "tutor" | "socratic" | "concise";
  length?: "short" | "medium" | "long";
  include_code?: boolean;
  provider?: string;
  model?: string;
  temperature?: number;
}

export interface Provider {
  id: string;
  models: string[];
}

export interface ProvidersResponse {
  default_provider: string;
  providers: Provider[];
}

export interface GenerateResponse {
  job_id: string;
}

export interface ExportResponse {
  filename: string;
  content: string | Record<string, unknown>;
}
