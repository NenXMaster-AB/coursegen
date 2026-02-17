"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function MotionCard({ children, className, hover = true }: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-border-subtle bg-card p-5 transition-shadow",
        hover && "cursor-pointer hover:border-border-default hover:gold-glow",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
