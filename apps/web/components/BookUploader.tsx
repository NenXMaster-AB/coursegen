"use client";

import { useState } from "react";
import { apiPostForm } from "../lib/api";

export function BookUploader({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      if (author) form.append("author", author);
      await apiPostForm("/books/ingest", form);
      setFile(null); setTitle(""); setAuthor("");
      onDone();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
        <div>
          <div style={{fontSize:18, fontWeight:700}}>Import a book</div>
          <div className="small">PDF / EPUB / TXT / MD</div>
        </div>
      </div>
      <hr/>
      <div className="row" style={{flexWrap:"wrap"}}>
        <div className="col">
          <input className="input" type="file" accept=".pdf,.epub,.txt,.md" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="col">
          <input className="input" placeholder="Optional title override" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div className="col">
          <input className="input" placeholder="Optional author" value={author} onChange={(e)=>setAuthor(e.target.value)} />
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <button className="btn" onClick={upload} disabled={!file || busy}>{busy ? "Uploading…" : "Ingest"}</button>
        </div>
      </div>
      {err && <div style={{marginTop:10}} className="small">Error: {err}</div>}
    </div>
  );
}
