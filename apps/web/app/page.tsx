"use client";

import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { BookGrid } from "@/components/library/BookGrid";
import { UploadDialog } from "@/components/library/UploadDialog";
import { EmptyLibrary } from "@/components/library/EmptyLibrary";
import { useBooks } from "@/lib/hooks/useBooks";
import { Loader2 } from "lucide-react";

export default function LibraryPage() {
  const { books, loading, refetch } = useBooks();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <PageTransition>
          {/* Page header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Library
              </h1>
              <p className="text-text-secondary mt-1">
                Your uploaded books and learning materials
              </p>
            </div>
            <UploadDialog onSuccess={refetch} />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <EmptyLibrary />
          ) : (
            <BookGrid books={books} />
          )}
        </PageTransition>
      </main>
    </>
  );
}
