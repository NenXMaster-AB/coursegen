"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiGet } from "../lib/api";

type Artifact = {
  id:number; chapter_id:number; type:"summary"|"quiz"|"lab"|"takeaways";
  content_md:string; provider:string; model:string; version:number; created_at:string;
};

export function ArtifactPanel({ chapterId, refreshKey }: { chapterId: number | null; refreshKey: number }) {
  const [arts, setArts] = useState<Artifact[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) return;
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const data = await apiGet<Artifact[]>(`/artifacts/by-chapter/${chapterId}`);
        if (alive) setArts(data);
      } catch (e:any) {
        if (alive) setErr(e?.message || String(e));
      }
    })();
    return () => { alive = false; };
  }, [chapterId, refreshKey]);

  const grouped = useMemo(() => {
    const g: Record<string, Artifact[]> = {};
    for (const a of arts) {
      g[a.type] = g[a.type] || [];
      g[a.type].push(a);
    }
    // keep newest first
    for (const k of Object.keys(g)) g[k].sort((x,y)=>y.version-x.version);
    return g;
  }, [arts]);

  if (!chapterId) return (
    <div className="card">
      <div style={{fontWeight:800}}>Artifacts</div>
      <div className="small">Select a chapter to view artifacts.</div>
    </div>
  );

  return (
    <div className="card" style={{height:"70vh", overflow:"auto"}}>
      <div style={{fontWeight:900}}>Artifacts</div>
      <div className="small">Newest version appears first.</div>
      <hr/>
      {err && <div className="small">Error: {err}</div>}
      {Object.keys(grouped).length === 0 && <div className="small">No artifacts yet. Generate one!</div>}
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} style={{marginBottom:18}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{fontWeight:900, textTransform:"capitalize"}}>{type}</div>
            <div className="badge">{items[0]?.provider} {items[0]?.model}</div>
          </div>
          <div className="small">Versions: {items.map(i=>`v${i.version}`).join(", ")}</div>
          <div style={{marginTop:10}}>
            <ReactMarkdown>{items[0]?.content_md || ""}</ReactMarkdown>
          </div>
          <hr/>
        </div>
      ))}
    </div>
  );
}
