"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type Chapter = { id: number; book_id: number; index: number; title: string; word_count: number; };

export function ChapterList({ bookId, selectedChapterId, onSelect }: { bookId: number; selectedChapterId: number | null; onSelect: (c: Chapter) => void; }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const data = await apiGet<Chapter[]>(`/chapters/by-book/${bookId}`);
        if (alive) setChapters(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || String(e));
      }
    })();
    return () => { alive = false; };
  }, [bookId]);

  return (
    <div className="card" style={{height:"70vh", overflow:"auto"}}>
      <div style={{fontSize:16, fontWeight:700}}>Chapters</div>
      <div className="small">Select a chapter to generate artifacts.</div>
      <hr/>
      {err && <div className="small">Error: {err}</div>}
      <div style={{display:"flex", flexDirection:"column", gap:8}}>
        {chapters.map((c) => (
          <button
            key={c.id}
            className={"btn " + (selectedChapterId === c.id ? "" : "secondary")}
            style={{textAlign:"left"}}
            onClick={() => onSelect(c)}
          >
            <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
              <div><span className="badge">#{c.index}</span> {c.title}</div>
              <div className="small">{c.word_count.toLocaleString()} words</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
