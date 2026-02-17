"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PageTransition } from "@/components/layout/PageTransition";
import { BookHeader } from "@/components/book/BookHeader";
import { useChapters } from "@/lib/hooks/useChapters";
import { getBooks } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ChevronRight, BookOpen, Loader2 } from "lucide-react";
import type { Book } from "@/lib/types";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);
  const [book, setBook] = useState<Book | null>(null);
  const { chapters, loading } = useChapters(bookId);

  useEffect(() => {
    getBooks().then((books) => {
      const found = books.find((b) => b.id === bookId);
      if (found) setBook(found);
    });
  }, [bookId]);

  if (!book) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);

  return (
    <PageTransition>
      <BookHeader book={book} chapterCount={chapters.length} />

      {/* Stats bar */}
      <div className="flex gap-6 mt-6 mb-8">
        <div className="rounded-lg border border-border-subtle bg-card px-4 py-3 flex-1 text-center">
          <div className="text-2xl font-display font-bold text-gold">
            {chapters.length}
          </div>
          <div className="text-xs text-text-tertiary mt-0.5">Chapters</div>
        </div>
        <div className="rounded-lg border border-border-subtle bg-card px-4 py-3 flex-1 text-center">
          <div className="text-2xl font-display font-bold text-text-primary">
            {formatNumber(totalWords)}
          </div>
          <div className="text-xs text-text-tertiary mt-0.5">Words</div>
        </div>
      </div>

      {/* Chapter list */}
      <h2 className="font-display text-lg font-semibold mb-4">Chapters</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {chapters.map((ch) => (
            <motion.button
              key={ch.id}
              variants={staggerItem}
              onClick={() => router.push(`/books/${bookId}/chapters/${ch.index}`)}
              className="w-full text-left rounded-lg border border-border-subtle bg-card px-5 py-4 flex items-center gap-4 hover:border-border-default hover:bg-elevated/50 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                <BookOpen className="w-4 h-4 text-gold/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-tertiary">
                    {String(ch.index).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-text-primary truncate group-hover:text-gold transition-colors">
                    {ch.title}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {formatNumber(ch.word_count)} words
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-gold transition-colors shrink-0" />
            </motion.button>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
