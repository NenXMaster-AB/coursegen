"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Layers, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { getFlashcardStats, getFlashcardSession, getAnkiExportUrl } from "@/lib/api";
import { FlashcardCard } from "./FlashcardCard";
import { ReviewSession } from "./ReviewSession";
import { DeckStats } from "./DeckStats";
import type { Artifact, FlashcardContent, DeckStats as DeckStatsType, FlashcardReviewState } from "@/lib/types";

interface FlashcardViewProps {
  artifact: Artifact;
}

export function FlashcardView({ artifact }: FlashcardViewProps) {
  const content = artifact.content_json as FlashcardContent;
  const cards = content?.cards || [];

  const [mode, setMode] = useState<"browse" | "review">("browse");
  const [stats, setStats] = useState<DeckStatsType | null>(null);
  const [dueIndices, setDueIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getFlashcardStats(artifact.id);
      setStats(s);
    } catch {
      // Stats unavailable — non-blocking
    }
  }, [artifact.id]);

  useEffect(() => {
    setLoading(true);
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  const startReview = async () => {
    try {
      const session = await getFlashcardSession(artifact.id);
      const indices = session.map((r: FlashcardReviewState) => r.card_index);
      setDueIndices(indices);
      setMode("review");
    } catch {
      // Fallback: review all cards
      setDueIndices(cards.map((_, i) => i));
      setMode("review");
    }
  };

  const handleReviewComplete = () => {
    setMode("browse");
    fetchStats();
  };

  if (!cards.length) {
    return (
      <div className="text-sm text-text-secondary">
        No flashcards available in structured format.
      </div>
    );
  }

  if (mode === "review" && dueIndices.length > 0) {
    return (
      <ReviewSession
        artifactId={artifact.id}
        cards={cards}
        dueIndices={dueIndices}
        onComplete={handleReviewComplete}
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Flashcards
          </h3>
          <span className="text-xs text-text-tertiary font-mono">({cards.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              window.open(getAnkiExportUrl(artifact.id), "_blank");
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export Anki
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={startReview}
            disabled={loading || (stats !== null && stats.due_now === 0)}
          >
            <Play className="w-3.5 h-3.5" />
            Start Review
            {stats && stats.due_now > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-mono">
                {stats.due_now}
              </span>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div variants={staggerItem}>
          <DeckStats stats={stats} />
        </motion.div>
      )}

      {/* Card grid */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((card, i) => (
            <FlashcardCard key={i} card={card} index={i} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
