"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";
import { BookUploader } from "../components/BookUploader";
import { ChapterList } from "../components/ChapterList";
import { GenerationControls } from "../components/GenerationControls";
import { JobStatus } from "../components/JobStatus";
import { ArtifactPanel } from "../components/ArtifactPanel";

type Book = { id:number; title:string; author:string|null; source_type:string; created_at:string; };
type Chapter = { id:number; book_id:number; index:number; title:string; word_count:number; };

export default function Page() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function refreshBooks() {
    const data = await apiGet<Book[]>("/books");
    setBooks(data);
    if (!selectedBookId && data.length) setSelectedBookId(data[0].id);
  }

  useEffect(() => { refreshBooks(); }, []);

  const selectedBook = useMemo(()=> books.find(b=>b.id===selectedBookId) || null, [books, selectedBookId]);

  return (
    <main style={{display:"flex", flexDirection:"column", gap:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12}}>
        <div>
          <div style={{fontSize:28, fontWeight:900}}>CourseGen</div>
          <div className="small">Ingest an ebook → generate summaries, quizzes, labs, takeaways (OpenAI or local models)</div>
        </div>
        <div className="badge">v0.1.0</div>
      </div>

      <BookUploader onDone={async ()=>{ await refreshBooks(); }} />

      <div className="card">
        <div style={{display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <div style={{fontWeight:800}}>Library</div>
          <select className="input" style={{maxWidth:520}} value={selectedBookId ?? ""} onChange={(e)=>{ setSelectedBookId(parseInt(e.target.value)); setSelectedChapter(null); }}>
            {books.map(b => <option key={b.id} value={b.id}>{b.title} {b.author ? `— ${b.author}` : ""} ({b.source_type})</option>)}
          </select>
          {selectedBook && <span className="small">Book ID: {selectedBook.id}</span>}
        </div>
      </div>

      <div className="row" style={{alignItems:"stretch"}}>
        <div className="col">
          {selectedBookId ? (
            <ChapterList
              bookId={selectedBookId}
              selectedChapterId={selectedChapter?.id || null}
              onSelect={(c)=>setSelectedChapter(c)}
            />
          ) : (
            <div className="card">No books yet — ingest one above.</div>
          )}
        </div>

        <div className="col" style={{display:"flex", flexDirection:"column", gap:16}}>
          {selectedBookId && selectedChapter ? (
            <>
              <GenerationControls
                bookId={selectedBookId}
                chapterIndex={selectedChapter.index}
                onJob={(id)=>{ setJobId(id); }}
              />
              <JobStatus
                jobId={jobId}
                onFinished={() => setRefreshKey((k)=>k+1)}
              />
            </>
          ) : (
            <div className="card">
              <div style={{fontWeight:900}}>Generate</div>
              <div className="small">Select a book and chapter.</div>
            </div>
          )}

          <ArtifactPanel chapterId={selectedChapter?.id || null} refreshKey={refreshKey} />
        </div>
      </div>

      <div className="small">
        Tip: set <code>COURSEGEN_LLM_PROVIDER</code> to <code>ollama</code> to use local models.
      </div>
    </main>
  );
}
