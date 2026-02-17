"use client";

import { motion } from "motion/react";
import { BookOpen } from "lucide-react";

export function EmptyLibrary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-gold/60" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
        Your library is empty
      </h2>
      <p className="text-text-secondary max-w-sm">
        Upload a book to get started. CourseGen will extract chapters and generate
        interactive learning materials.
      </p>
    </motion.div>
  );
}
