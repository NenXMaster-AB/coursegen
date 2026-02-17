"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useProviders } from "@/lib/hooks/useProviders";
import { generate } from "@/lib/api";
import type { ArtifactType, GenerateRequest } from "@/lib/types";

interface GenerationPanelProps {
  bookId: number;
  chapterIndex: number;
  onJob: (jobId: string) => void;
}

const artifactOptions: { type: ArtifactType; label: string }[] = [
  { type: "summary", label: "Summary" },
  { type: "takeaways", label: "Takeaways" },
  { type: "quiz", label: "Quiz" },
  { type: "lab", label: "Lab" },
];

export function GenerationPanel({
  bookId,
  chapterIndex,
  onJob,
}: GenerationPanelProps) {
  const { data: providersData } = useProviders();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [tone, setTone] = useState<"tutor" | "socratic" | "concise">("tutor");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [includeCode, setIncludeCode] = useState(true);
  const [temperature, setTemperature] = useState(0.3);
  const [outputs, setOutputs] = useState<Set<ArtifactType>>(
    new Set(["summary", "takeaways", "quiz", "lab"]),
  );

  useEffect(() => {
    if (providersData) {
      const p = providersData.default_provider || providersData.providers[0]?.id;
      if (p) {
        setProvider(p);
        const prov = providersData.providers.find((x) => x.id === p);
        if (prov?.models[0]) setModel(prov.models[0]);
      }
    }
  }, [providersData]);

  const currentProviderModels =
    providersData?.providers.find((p) => p.id === provider)?.models ?? [];

  const toggleOutput = (type: ArtifactType) => {
    setOutputs((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (outputs.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const req: GenerateRequest = {
        book_id: bookId,
        chapter_index: chapterIndex,
        outputs: Array.from(outputs),
        difficulty,
        tone,
        length,
        include_code: includeCode,
        provider,
        model,
        temperature,
      };
      const res = await generate(req);
      onJob(res.job_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold">Generate Artifacts</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1 transition-colors"
          >
            Settings
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <Button
            onClick={handleGenerate}
            disabled={busy || outputs.size === 0}
            size="sm"
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {busy ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {/* Output type toggles */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {artifactOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => toggleOutput(opt.type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              outputs.has(opt.type)
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-elevated text-text-tertiary border border-border-subtle hover:text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Expandable settings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border-subtle space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-3">
                {/* Provider */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(v) => {
                      setProvider(v);
                      const prov = providersData?.providers.find((p) => p.id === v);
                      if (prov?.models[0]) setModel(prov.models[0]);
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm bg-surface border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providersData?.providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-8 text-sm bg-surface border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProviderModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                    <SelectTrigger className="h-8 text-sm bg-surface border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="h-8 text-sm bg-surface border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutor">Tutor</SelectItem>
                      <SelectItem value="socratic">Socratic</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Length</Label>
                  <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                    <SelectTrigger className="h-8 text-sm bg-surface border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">
                    Temperature: {temperature.toFixed(1)}
                  </Label>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                    min={0}
                    max={1.5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeCode"
                  checked={includeCode}
                  onCheckedChange={(v) => setIncludeCode(!!v)}
                />
                <Label
                  htmlFor="includeCode"
                  className="text-sm text-text-secondary cursor-pointer"
                >
                  Include code examples
                </Label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-5 pb-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
