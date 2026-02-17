"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Term } from "@/lib/types";

interface TermGlossaryProps {
  terms: Term[];
}

export function TermGlossary({ terms }: TermGlossaryProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return terms;
    const q = search.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q),
    );
  }, [terms, search]);

  if (terms.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="pl-8 h-8 text-sm bg-surface border-border-subtle"
        />
      </div>
      <Accordion type="multiple" className="space-y-1">
        {filtered.map((t, i) => (
          <AccordionItem
            key={i}
            value={`term-${i}`}
            className="border border-border-subtle rounded-lg px-4 data-[state=open]:bg-surface"
          >
            <AccordionTrigger className="text-sm font-medium text-gold hover:no-underline py-3">
              {t.term}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-text-secondary pb-3">
              {t.definition}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {filtered.length === 0 && (
        <p className="text-xs text-text-tertiary text-center py-4">
          No matching terms
        </p>
      )}
    </div>
  );
}
