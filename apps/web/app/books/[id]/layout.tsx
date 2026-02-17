"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ChapterNav } from "@/components/book/ChapterNav";
import { useChapters } from "@/lib/hooks/useChapters";
import { getBooks, getArtifacts } from "@/lib/api";
import type { Book, ArtifactType } from "@/lib/types";
import { Loader2, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const bookId = Number(params.id);
  const [book, setBook] = useState<Book | null>(null);
  const { chapters, loading } = useChapters(bookId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chapterArtifacts, setChapterArtifacts] = useState<
    Map<number, Set<ArtifactType>>
  >(new Map());

  const pathname = usePathname();
  const chapterMatch = pathname.match(/\/chapters\/(\d+)/);
  const chapterIndex = chapterMatch ? Number(chapterMatch[1]) : null;

  useEffect(() => {
    getBooks().then((books) => {
      const found = books.find((b) => b.id === bookId);
      if (found) setBook(found);
    });
  }, [bookId]);

  // Load artifact indicators for all chapters
  useEffect(() => {
    if (!chapters.length) return;
    const map = new Map<number, Set<ArtifactType>>();
    Promise.all(
      chapters.map(async (ch) => {
        try {
          const arts = await getArtifacts(ch.id);
          const types = new Set<ArtifactType>();
          arts.forEach((a) => types.add(a.type));
          if (types.size > 0) map.set(ch.id, types);
        } catch {
          // ignore
        }
      }),
    ).then(() => setChapterArtifacts(new Map(map)));
  }, [chapters]);

  const breadcrumbs = book
    ? [{ label: book.title }]
    : [];

  return (
    <>
      <Header breadcrumbs={breadcrumbs} />
      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } shrink-0 border-r border-border-subtle bg-surface overflow-hidden transition-all duration-300`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
            </div>
          ) : (
            <ChapterNav
              chapters={chapters}
              bookId={bookId}
              activeIndex={chapterIndex}
              chapterArtifacts={chapterArtifacts}
            />
          )}
        </aside>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 bottom-4 z-30 ml-2 w-8 h-8 text-text-tertiary hover:text-text-primary"
          style={sidebarOpen ? { left: "19rem" } : {}}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </Button>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
