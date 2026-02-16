"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostJson } from "../lib/api";

type ProvidersResp = { default_provider: string; providers: {id:string; models:string[]}[] };

export function GenerationControls({
  bookId,
  chapterIndex,
  onJob,
}: {
  bookId: number;
  chapterIndex: number;
  onJob: (jobId: string) => void;
}) {
  const [providers, setProviders] = useState<ProvidersResp | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [tone, setTone] = useState("tutor");
  const [length, setLength] = useState("medium");
  const [includeCode, setIncludeCode] = useState(true);
  const [temperature, setTemperature] = useState(0.3);
  const [outputs, setOutputs] = useState<{[k:string]: boolean}>({summary:true, quiz:false, lab:false, takeaways:true});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const data = await apiGet<ProvidersResp>("/providers");
      setProviders(data);
      setProvider(data.default_provider);
      const first = data.providers.find(p=>p.id===data.default_provider) || data.providers[0];
      setModel(first.models[0] || "");
    })();
  }, []);

  useEffect(() => {
    if (!providers) return;
    const p = providers.providers.find(x=>x.id===provider);
    setModel(p?.models?.[0] || "");
  }, [provider]);

  async function run() {
    setBusy(true); setErr(null);
    try {
      const selected = Object.entries(outputs).filter(([k,v])=>v).map(([k])=>k);
      const resp = await apiPostJson<{job_id:string}>("/generate", {
        book_id: bookId,
        chapter_index: chapterIndex,
        outputs: selected,
        difficulty,
        tone,
        length,
        include_code: includeCode,
        provider,
        model,
        temperature
      });
      onJob(resp.job_id);
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const models = providers?.providers.find(p=>p.id===provider)?.models || [];

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
        <div>
          <div style={{fontSize:16, fontWeight:800}}>Generate artifacts</div>
          <div className="small">Chapter #{chapterIndex}</div>
        </div>
        <button className="btn" onClick={run} disabled={busy || chapterIndex < 1}>
          {busy ? "Queued…" : "Generate"}
        </button>
      </div>
      <hr/>

      <div className="row" style={{flexWrap:"wrap"}}>
        <div className="col">
          <div className="small">Provider</div>
          <select className="input" value={provider} onChange={(e)=>setProvider(e.target.value)}>
            {providers?.providers.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
          </select>
        </div>
        <div className="col">
          <div className="small">Model</div>
          <select className="input" value={model} onChange={(e)=>setModel(e.target.value)}>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="col">
          <div className="small">Difficulty</div>
          <select className="input" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
        <div className="col">
          <div className="small">Tone</div>
          <select className="input" value={tone} onChange={(e)=>setTone(e.target.value)}>
            <option value="tutor">tutor</option>
            <option value="socratic">socratic</option>
            <option value="concise">concise</option>
          </select>
        </div>
      </div>

      <div className="row" style={{marginTop:12, flexWrap:"wrap"}}>
        <div className="col">
          <div className="small">Length</div>
          <select className="input" value={length} onChange={(e)=>setLength(e.target.value)}>
            <option value="short">short</option>
            <option value="medium">medium</option>
            <option value="long">long</option>
          </select>
        </div>
        <div className="col">
          <div className="small">Temperature</div>
          <input className="input" type="number" step="0.1" min="0" max="1.5" value={temperature} onChange={(e)=>setTemperature(parseFloat(e.target.value))} />
        </div>
        <div className="col" style={{display:"flex", alignItems:"center", gap:10}}>
          <input type="checkbox" checked={includeCode} onChange={(e)=>setIncludeCode(e.target.checked)} />
          <div>Include code examples</div>
        </div>
      </div>

      <hr/>
      <div className="row" style={{flexWrap:"wrap"}}>
        {["summary","takeaways","quiz","lab"].map(k => (
          <label key={k} style={{display:"flex", alignItems:"center", gap:8}}>
            <input type="checkbox" checked={!!outputs[k]} onChange={(e)=>setOutputs(prev=>({...prev,[k]:e.target.checked}))}/>
            <span>{k}</span>
          </label>
        ))}
      </div>

      {err && <div style={{marginTop:10}} className="small">Error: {err}</div>}
    </div>
  );
}
