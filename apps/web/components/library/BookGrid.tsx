"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { BookCard } from "./BookCard";
import type { Book } from "@/lib/types";

interface BookGridProps {
  books: Book[];
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      {books.map((book) => (
        <motion.div key={book.id} variants={staggerItem}>
          <BookCard book={book} />
        </motion.div>
      ))}
    </motion.div>
  );
}
