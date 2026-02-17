"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { UploadDropzone } from "./UploadDropzone";
import { ingestBook } from "@/lib/api";

interface UploadDialogProps {
  onSuccess: () => void;
}

export function UploadDialog({ onSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setTitle("");
    setAuthor("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      if (author) form.append("author", author);
      await ingestBook(form);
      reset();
      setOpen(false);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Upload Book
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border-subtle sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Upload a Book</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <UploadDropzone file={file} onFile={setFile} />

          <div className="space-y-2">
            <Label htmlFor="title" className="text-text-secondary text-sm">
              Title override (optional)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-detected from file"
              className="bg-surface border-border-subtle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author" className="text-text-secondary text-sm">
              Author (optional)
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="bg-surface border-border-subtle"
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!file || busy}
            className="w-full"
          >
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {busy ? "Ingesting..." : "Ingest Book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
