"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadTranscript } from "@/hooks/use-transcripts";
import { cn } from "@/lib/utils";

export default function uploadForm() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending, isSuccess, reset } = useUploadTranscript();

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onSubmit = () => {
    if (!selectedFile) return;
    mutate(selectedFile, {
      onSuccess: () => {
        toast.success("Session uploaded and analysed!", {
          description: "Your transcript has been processed.",
        });
      },
      onError: (err) => {
        toast.error("Upload failed", { description: err.message });
      },
    });
  };

  const clearFile = () => {
    setSelectedFile(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 transition-colors cursor-pointer",
          dragOver
            ? "border-blue-500 bg-blue-50"
            : selectedFile
            ? "border-blue-300 bg-blue-50/40"
            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
        )}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-20 w-20 text-green-500" strokeWidth={1.5} />
        ) : isPending ? (
          <Loader2 className="h-20 w-20 animate-spin text-blue-500" strokeWidth={1.5} />
        ) : selectedFile ? (
          <FileText className="h-20 w-20 text-blue-500" strokeWidth={1.5} />
        ) : (
          <UploadCloud className="h-20 w-20 text-blue-400" strokeWidth={1.5} />
        )}

        {isSuccess ? (
          <div className="text-center">
            <p className="font-semibold text-green-700">Upload complete!</p>
            <p className="text-sm text-gray-500 mt-1">Session analysed successfully.</p>
          </div>
        ) : isPending ? (
          <div className="text-center">
            <p className="font-semibold text-blue-700">Uploading & analysing…</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds.</p>
          </div>
        ) : selectedFile ? (
          <div className="text-center">
            <p className="font-semibold text-gray-800 truncate max-w-xs">{selectedFile.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB — click to change
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-semibold text-gray-700">Drop your transcript here</p>
            <p className="text-sm text-gray-400 mt-1">
              or <span className="text-blue-600 underline underline-offset-2">browse files</span>
              {" "}— .json, .jsonl, .txt, .md · up to 10 MB
            </p>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".json,.jsonl,.txt,.md"
        onChange={onInputChange}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex gap-3">
        {selectedFile && !isSuccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFile}
            disabled={isPending}
            className="gap-2"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            Clear
          </Button>
        )}
        {isSuccess ? (
          <Button variant="outline" size="sm" onClick={clearFile} className="gap-2">
            <UploadCloud className="h-4 w-4" strokeWidth={2} />
            Upload another
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!selectedFile || isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <UploadCloud className="h-4 w-4" strokeWidth={2} />
            )}
            {isPending ? "Analysing…" : "Upload & Analyse"}
          </Button>
        )}
      </div>
    </div>
  );
}
