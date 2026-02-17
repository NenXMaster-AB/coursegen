"use client";

import { motion } from "motion/react";
import { Lightbulb } from "lucide-react";

interface ConceptCardProps {
  concept: string;
  index: number;
}

export function ConceptCard({ concept, index }: ConceptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border-subtle bg-surface p-4 hover:border-border-default transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-md bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-3.5 h-3.5 text-gold" />
        </div>
        <p className="text-sm text-text-primary leading-relaxed">{concept}</p>
      </div>
    </motion.div>
  );
}
