"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FileText, BookOpen, FileCode, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Book } from "@/lib/types";

const typeConfig: Record<string, { icon: typeof FileText; gradient: string }> = {
  pdf: { icon: FileText, gradient: "from-red-900/40 to-red-950/20" },
  epub: { icon: BookOpen, gradient: "from-emerald-900/40 to-emerald-950/20" },
  txt: { icon: FileCode, gradient: "from-blue-900/40 to-blue-950/20" },
  md: { icon: FileCode, gradient: "from-purple-900/40 to-purple-950/20" },
};

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const config = typeConfig[book.source_type] ?? { icon: File, gradient: "from-zinc-900/40 to-zinc-950/20" };
  const Icon = config.icon;

  return (
    <Link href={`/books/${book.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group rounded-xl border border-border-subtle bg-card overflow-hidden transition-shadow hover:border-border-default hover:gold-glow cursor-pointer"
      >
        {/* Cover placeholder */}
        <div className={`relative h-40 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          <Icon className="w-12 h-12 text-text-tertiary/60 group-hover:text-gold/50 transition-colors" />
          <Badge
            variant="outline"
            className="absolute top-3 right-3 text-[10px] uppercase tracking-wider border-border-subtle text-text-tertiary"
          >
            {book.source_type}
          </Badge>
        </div>

        {/* Info */}
        <div className="p-4 space-y-1.5">
          <h3 className="font-display text-base font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-gold transition-colors">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-sm text-text-secondary truncate">{book.author}</p>
          )}
          <p className="text-xs text-text-tertiary">{formatDate(book.created_at)}</p>
        </div>
      </motion.div>
    </Link>
  );
}
