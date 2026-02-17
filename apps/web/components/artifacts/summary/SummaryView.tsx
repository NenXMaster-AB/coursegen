"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ConceptCard } from "./ConceptCard";
import { TermGlossary } from "./TermGlossary";
import { AlertTriangle, Star, BookOpen } from "lucide-react";
import type { Artifact, SummaryContent } from "@/lib/types";

interface SummaryViewProps {
  artifact: Artifact;
}

export function SummaryView({ artifact }: SummaryViewProps) {
  const content = artifact.content_json as SummaryContent;

  if (!content || !content.overview) {
    return (
      <div className="text-sm text-text-secondary">
        Summary data is not available in structured format.
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Overview */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Overview
          </h3>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
            {content.overview}
          </p>
        </div>
      </motion.div>

      {/* Key Concepts */}
      {content.concepts?.length > 0 && (
        <motion.div variants={staggerItem}>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Key Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.concepts.map((concept, i) => (
              <ConceptCard key={i} concept={concept} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Glossary */}
      {content.terms?.length > 0 && (
        <motion.div variants={staggerItem}>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Glossary
          </h3>
          <TermGlossary terms={content.terms} />
        </motion.div>
      )}

      {/* Pitfalls */}
      {content.pitfalls?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-gold-warm" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Common Pitfalls
            </h3>
          </div>
          <div className="space-y-2">
            {content.pitfalls.map((pitfall, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gold-warm/20 bg-gold-warm/5 p-3"
              >
                <span className="text-gold-warm text-sm font-mono shrink-0">!</span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {pitfall}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Takeaways */}
      {content.key_takeaways?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Key Takeaways
            </h3>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-5 space-y-2">
            {content.key_takeaways.map((takeaway, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono text-gold font-bold">
                    {i + 1}
                  </span>
                </span>
                <p className="text-sm text-text-primary leading-relaxed">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
