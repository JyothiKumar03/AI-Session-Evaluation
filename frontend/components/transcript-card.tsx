"use client";

import { useRouter } from "next/navigation";
import { FileText, Clock, MessagesSquare, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeleteTranscript } from "@/hooks/use-transcripts";
import type { TranscriptRow } from "@/types";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS, SOURCE_COLORS } from "@/constants/sources";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

type Props = { transcript: TranscriptRow };

export default function transcriptCard({ transcript }: Props) {
  const router = useRouter();
  const { mutate: deleteTranscript, isPending } = useDeleteTranscript();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTranscript(transcript.id, {
      onSuccess: () => toast.success("Session deleted"),
      onError: (err) => toast.error("Delete failed", { description: err.message }),
    });
  };

  const handleClick = () => {
    router.push(`/transcripts/${transcript.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-200 hover:shadow-md group",
        "bg-white"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 shrink-0 text-blue-500" strokeWidth={1.8} />
            <CardTitle className="truncate text-gray-900 text-sm">
              {transcript.filename}
            </CardTitle>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
              SOURCE_COLORS[transcript.source] ?? SOURCE_COLORS.generic
            )}
          >
            {SOURCE_LABELS[transcript.source] ?? transcript.source}
          </span>
        </div>
        <CardDescription className="sr-only">{transcript.filename}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MessagesSquare className="h-4 w-4" strokeWidth={1.8} />
              <span>{transcript.message_count} messages</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-4 w-4" strokeWidth={1.8} />
              <span>{formatDate(transcript.uploaded_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-500"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              )}
            </Button>
            <ArrowRight className="h-5 w-5 text-blue-400" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
