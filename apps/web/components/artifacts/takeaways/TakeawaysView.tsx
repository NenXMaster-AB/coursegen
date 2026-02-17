"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import {
  Star,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { Artifact, TakeawaysContent } from "@/lib/types";

interface TakeawaysViewProps {
  artifact: Artifact;
}

export function TakeawaysView({ artifact }: TakeawaysViewProps) {
  const content = artifact.content_json as TakeawaysContent;

  if (!content || !content.top_takeaways) {
    return (
      <div className="text-sm text-text-secondary">
        Takeaways data is not available in structured format.
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
      {/* Top Takeaways */}
      {content.top_takeaways?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Top Takeaways
            </h3>
          </div>
          <div className="space-y-2">
            {content.top_takeaways.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-lg border border-border-subtle bg-card p-4 hover:border-gold/30 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono text-gold font-bold">
                    {i + 1}
                  </span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{t}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Common Mistakes */}
      {content.common_mistakes?.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-gold-warm" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Common Mistakes
            </h3>
          </div>
          <div className="rounded-xl border border-gold-warm/20 bg-gold-warm/5 p-5 space-y-3">
            {content.common_mistakes.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-gold-warm text-sm font-mono shrink-0">!</span>
                <p className="text-sm text-text-secondary leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* When to use / When not to use */}
      {(content.when_to_use?.length > 0 || content.when_not_to_use?.length > 0) && (
        <motion.div variants={staggerItem}>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Usage Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* When to use */}
            {content.when_to_use?.length > 0 && (
              <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="w-4 h-4 text-success" />
                  <span className="text-xs font-semibold text-success uppercase tracking-wider">
                    When to Use
                  </span>
                </div>
                <ul className="space-y-2">
                  {content.when_to_use.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-success shrink-0 mt-0.5">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When not to use */}
            {content.when_not_to_use?.length > 0 && (
              <div className="rounded-xl border border-error/20 bg-error/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsDown className="w-4 h-4 text-error" />
                  <span className="text-xs font-semibold text-error uppercase tracking-wider">
                    When Not to Use
                  </span>
                </div>
                <ul className="space-y-2">
                  {content.when_not_to_use.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-error shrink-0 mt-0.5">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
