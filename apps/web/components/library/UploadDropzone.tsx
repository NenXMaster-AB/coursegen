"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  file: File | null;
  onFile: (file: File | null) => void;
}

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/epub+zip": [".epub"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

export function UploadDropzone({ file, onFile }: UploadDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300",
        isDragActive
          ? "border-gold bg-gold-glow gold-glow"
          : "border-border-default hover:border-gold/50 hover:bg-gold-glow/50",
      )}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3"
          >
            <FileUp className="w-5 h-5 text-gold" />
            <span className="text-sm text-text-primary font-medium">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="p-1 rounded-md hover:bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <motion.div
              animate={isDragActive ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Upload className={cn("w-8 h-8 mx-auto", isDragActive ? "text-gold" : "text-text-tertiary")} />
            </motion.div>
            <p className="text-sm text-text-secondary">
              Drop a file here or <span className="text-gold">browse</span>
            </p>
            <p className="text-xs text-text-tertiary">PDF, EPUB, TXT, or Markdown</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
