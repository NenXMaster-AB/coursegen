"use client";

import type { DeckStats as DeckStatsType } from "@/lib/types";

interface DeckStatsProps {
  stats: DeckStatsType;
}

export function DeckStats({ stats }: DeckStatsProps) {
  const masteryPct = stats.total_cards > 0
    ? Math.round((stats.mature / stats.total_cards) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3">
      <div className="flex items-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-text-secondary">Due now</span>
          <span className="font-mono font-bold text-gold">{stats.due_now}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-text-secondary">Learning</span>
          <span className="font-mono font-bold text-text-primary">{stats.learning}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-text-secondary">Mature</span>
          <span className="font-mono font-bold text-text-primary">{stats.mature}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary">Avg ease</span>
          <span className="font-mono font-bold text-text-primary">{stats.average_ease.toFixed(2)}</span>
        </div>
      </div>

      {/* Mastery bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
          <span>Mastery</span>
          <span>{masteryPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-emerald-400 transition-all duration-500"
            style={{ width: `${masteryPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
