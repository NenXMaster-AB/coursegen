"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Download, Play, BookOpen, Clock, CheckCircle2 } from "lucide-react";
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

function formatTimeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function FlashcardView({ artifact }: FlashcardViewProps) {
  const content = artifact.content_json as FlashcardContent;
  const cards = content?.cards || [];

  const [mode, setMode] = useState<"browse" | "review" | "practice">("browse");
  const [stats, setStats] = useState<DeckStatsType | null>(null);
  const [dueIndices, setDueIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const reviewsDone = stats !== null && stats.due_now === 0;

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

  const startPractice = () => {
    setDueIndices(cards.map((_, i) => i));
    setMode("practice");
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

  if ((mode === "review" || mode === "practice") && dueIndices.length > 0) {
    return (
      <ReviewSession
        artifactId={artifact.id}
        cards={cards}
        dueIndices={dueIndices}
        mode={mode}
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
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={startPractice}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Practice
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={startReview}
            disabled={loading || reviewsDone}
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

      {/* Reviews complete banner */}
      <AnimatePresence>
        {reviewsDone && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-400">
                  You&apos;re all caught up!
                </p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  {stats.next_review_at ? (
                    <>
                      <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
                      Next review due in {formatTimeUntil(stats.next_review_at)}. Use Practice to study without affecting your schedule.
                    </>
                  ) : (
                    <>Reviews complete for today. Use Practice to keep studying without affecting your schedule.</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <AnimatePresence>
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <DeckStats stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode explanation */}
      <motion.div variants={staggerItem}>
        <p className="text-[11px] text-text-tertiary text-right">
          Review uses spaced repetition scheduling. Practice lets you study anytime without affecting progress.
        </p>
      </motion.div>

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
