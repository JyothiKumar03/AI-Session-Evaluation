"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  BadgeCheck,
  AlertCircle,
  Loader2,
  Star,
  PencilLine,
  Layers,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import scoreGrid from "@/components/score-grid";
import segmentsList from "@/components/segments-list";
import { useTranscriptDetail } from "@/hooks/use-transcripts";
import { cn } from "@/lib/utils";

const ScoreGrid = scoreGrid;
const SegmentsList = segmentsList;

const workflowColors: Record<string, string> = {
  "plan-first": "bg-violet-100 text-violet-700 border-violet-200",
  "dive-in": "bg-blue-100 text-blue-700 border-blue-200",
  iterative: "bg-green-100 text-green-700 border-green-200",
  reactive: "bg-amber-100 text-amber-700 border-amber-200",
  exploratory: "bg-sky-100 text-sky-700 border-sky-200",
};

const sourceLabels: Record<string, string> = {
  claude_code: "Claude Code",
  codex: "Codex",
  generic: "Generic",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="px-8 py-8 flex flex-col gap-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

type Props = { params: Promise<{ id: string }> };

export default function TranscriptDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useTranscriptDetail(id);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center px-8">
        <AlertCircle className="h-20 w-20 text-red-400" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-gray-800">Failed to load session</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as Error).message}
          </p>
        </div>
        <Link
          href="/transcripts"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to sessions
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { transcript, analysis } = data;

  return (
    <div className="px-8 py-8 flex flex-col gap-8 max-w-6xl">
      {/* Back */}
      <Link
        href="/transcripts"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to sessions
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-white ring-1 ring-foreground/10 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText
              className="h-7 w-7 text-blue-600"
              strokeWidth={1.8}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {transcript.filename}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {sourceLabels[transcript.source] ?? transcript.source}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">
                {transcript.message_count} messages
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">
                {formatDate(transcript.uploaded_at)}
              </span>
            </div>
          </div>
          {analysis?.workflow_pattern && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize",
                workflowColors[analysis.workflow_pattern] ??
                  "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              {analysis.workflow_pattern}
            </span>
          )}
        </div>

        {/* Snapshot summary */}
        {analysis?.snapshot_summary && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles
                className="h-4 w-4 text-blue-500"
                strokeWidth={1.8}
              />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {analysis.snapshot_summary}
            </p>
          </div>
        )}
      </div>

      {/* No analysis state */}
      {!analysis && (
        <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl bg-white ring-1 ring-foreground/10">
          <Loader2
            className="h-10 w-10 text-blue-400 animate-spin"
            strokeWidth={1.5}
          />
          <p className="text-gray-600 font-medium">Analysis not available</p>
          <p className="text-sm text-gray-400">
            This session may still be processing.
          </p>
        </div>
      )}

      {/* Scores */}
      {analysis && (
        <section>
          <SectionHeader
            icon={
              <BadgeCheck
                className="h-6 w-6 text-blue-600"
                strokeWidth={1.8}
              />
            }
            title="Metric Scores"
          />
          <ScoreGrid scores={analysis.overall_scores} />
        </section>
      )}

      {/* Strengths & Improvements */}
      {analysis && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Strengths */}
          <div className="rounded-xl bg-white ring-1 ring-foreground/10 p-5">
            <SectionHeader
              icon={
                <Star className="h-6 w-6 text-green-500" strokeWidth={1.8} />
              }
              title="Strengths"
            />
            {analysis.strengths.length === 0 ? (
              <p className="text-sm text-gray-400">None identified.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-400" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Improvements */}
          <div className="rounded-xl bg-white ring-1 ring-foreground/10 p-5">
            <SectionHeader
              icon={
                <PencilLine
                  className="h-6 w-6 text-amber-500"
                  strokeWidth={1.8}
                />
              }
              title="Areas to Improve"
            />
            {analysis.improvements.length === 0 ? (
              <p className="text-sm text-gray-400">None identified.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {analysis.improvements.map((imp, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    {imp}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Segments */}
      {analysis && analysis.segments.length > 0 && (
        <section>
          <SectionHeader
            icon={
              <Layers className="h-6 w-6 text-blue-600" strokeWidth={1.8} />
            }
            title={`Session Segments (${analysis.segments.length})`}
          />
          <SegmentsList segments={analysis.segments} />
        </section>
      )}
    </div>
  );
}
