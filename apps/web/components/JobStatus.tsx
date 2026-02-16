"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type Job = { id:string; status:string; progress:number; message:string|null; payload:any };

export function JobStatus({ jobId, onFinished }: { jobId: string | null; onFinished: () => void }) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let timer: any;
    let alive = true;

    async function tick() {
      try {
        const j = await apiGet<Job>(`/jobs/${jobId}`);
        if (!alive) return;
        setJob(j);
        if (j.status === "finished" || j.status === "failed") {
          onFinished();
          return;
        }
        timer = setTimeout(tick, 1200);
      } catch {
        timer = setTimeout(tick, 1500);
      }
    }

    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [jobId]);

  if (!jobId) return null;
  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
        <div>
          <div style={{fontWeight:800}}>Job</div>
          <div className="small">{jobId}</div>
        </div>
        <div className="badge">{job?.status || "…"}</div>
      </div>
      <hr/>
      <div className="small">{job?.message || "Polling…"}</div>
      <div style={{marginTop:8}}>
        <div style={{height:10, borderRadius:999, background:"#0b0f14", border:"1px solid #233144"}}>
          <div style={{height:"100%", width:`${job?.progress || 0}%`, background:"#1f6feb", borderRadius:999}} />
        </div>
      </div>
    </div>
  );
}
