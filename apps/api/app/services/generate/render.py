from __future__ import annotations
import json
from typing import Any

def to_markdown(artifact_type: str, data: dict[str, Any]) -> str:
    # Simple renderers. You can enhance later.
    if artifact_type == "summary":
        md = []
        md.append(f"# Summary\n\n{data.get('overview','').strip()}\n")
        if data.get("concepts"):
            md.append("## Concepts\n" + "\n".join([f"- {c}" for c in data["concepts"]]) + "\n")
        if data.get("terms"):
            md.append("## Terms\n" + "\n".join([f"- **{t.get('term','')}**: {t.get('definition','')}" for t in data["terms"]]) + "\n")
        if data.get("pitfalls"):
            md.append("## Pitfalls\n" + "\n".join([f"- {p}" for p in data["pitfalls"]]) + "\n")
        if data.get("key_takeaways"):
            md.append("## Key takeaways\n" + "\n".join([f"- {k}" for k in data["key_takeaways"]]) + "\n")
        return "\n".join(md).strip()

    if artifact_type == "takeaways":
        md = ["# Key Takeaways\n"]
        for k, title in [
            ("top_takeaways","Top takeaways"),
            ("common_mistakes","Common mistakes"),
            ("when_to_use","When to use"),
            ("when_not_to_use","When not to use"),
        ]:
            items = data.get(k) or []
            if items:
                md.append(f"## {title}\n" + "\n".join([f"- {i}" for i in items]) + "\n")
        return "\n".join(md).strip()

    if artifact_type == "quiz":
        md = ["# Quiz\n"]
        mcq = data.get("mcq") or []
        if mcq:
            md.append("## Multiple Choice\n")
            for i,q in enumerate(mcq, start=1):
                md.append(f"### {i}. {q.get('question','')}\n")
                for j,opt in enumerate(q.get("options",[])[:4], start=1):
                    md.append(f"- ({j}) {opt}")
                md.append(f"**Answer:** {int(q.get('answer_index',0))+1}\n")
                md.append(f"**Explanation:** {q.get('explanation','')}\n")
        sa = data.get("short_answer") or []
        if sa:
            md.append("## Short Answer\n")
            for i,q in enumerate(sa, start=1):
                md.append(f"### {i}. {q.get('question','')}\n")
                md.append(f"**Answer:** {q.get('answer','')}\n")
        coding = data.get("coding") or []
        if coding:
            md.append("## Coding\n")
            for i,c in enumerate(coding, start=1):
                md.append(f"### {i}. {c.get('prompt','')}\n")
                if c.get("constraints"):
                    md.append("**Constraints:**\n" + "\n".join([f"- {x}" for x in c["constraints"]]) + "\n")
                if c.get("solution_outline"):
                    md.append("**Solution outline:**\n" + "\n".join([f"- {x}" for x in c["solution_outline"]]) + "\n")
                if c.get("tests"):
                    md.append("**Tests (ideas):**\n" + "\n".join([f"- {x}" for x in c["tests"]]) + "\n")
        return "\n".join(md).strip()

    if artifact_type == "lab":
        md = ["# Lab\n"]
        md.append(f"## Objective\n{data.get('objective','')}\n")
        for k, title in [("prereqs","Prerequisites"),("steps","Steps"),("deliverables","Deliverables"),("stretch_goals","Stretch goals"),("rubric","Rubric")]:
            items = data.get(k) or []
            if items:
                md.append(f"## {title}\n" + "\n".join([f"- {i}" for i in items]) + "\n")
        return "\n".join(md).strip()

    return json.dumps(data, indent=2)
