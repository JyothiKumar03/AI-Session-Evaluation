"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Columns2,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import compareView from "@/components/compare-view";
import { useTranscripts, useCompare } from "@/hooks/use-transcripts";
import { cn } from "@/lib/utils";
import type { TranscriptRow } from "@/types";

const CompareView = compareView;

// ── Session picker ────────────────────────────────────────────────────────────

function SessionPicker({
  label,
  value,
  onChange,
  transcripts,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  transcripts: TranscriptRow[];
  exclude: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      {/* Show ~2 items then scroll */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-y-auto max-h-[116px]">
        {transcripts.length === 0 && (
          <p className="px-4 py-6 text-sm text-center text-gray-400">
            No sessions available
          </p>
        )}
        {transcripts.map((t) => {
          const isSelected = value === t.id;
          const isDisabled = exclude === t.id;
          return (
            <button
              key={t.id}
              disabled={isDisabled}
              onClick={() => onChange(t.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isSelected
                  ? "bg-blue-600"
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed bg-gray-50"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              <FileText
                className={cn(
                  "h-4 w-4 shrink-0",
                  isSelected ? "text-blue-200" : "text-gray-400"
                )}
                strokeWidth={1.8}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-white" : "text-gray-800"
                  )}
                >
                  {t.filename}
                </p>
                <p className={cn("text-xs", isSelected ? "text-blue-200" : "text-gray-400")}>
                  {t.message_count} messages
                </p>
              </div>
              {isSelected && (
                <CheckCircle2 className="shrink-0 h-4 w-4 text-white" strokeWidth={2} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Comparison result ─────────────────────────────────────────────────────────

function ComparisonResult({
  session1,
  session2,
}: {
  session1: string;
  session2: string;
}) {
  const { data, isLoading, isError, error } = useCompare(session1, session2);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl bg-white ring-1 ring-gray-200">
        <AlertCircle className="h-14 w-14 text-red-400" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-gray-900">Failed to load comparison</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <CompareView data={data} />;
}

// ── Main page (needs Suspense for useSearchParams) ────────────────────────────

function comparePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramS1 = searchParams.get("session1") ?? "";
  const paramS2 = searchParams.get("session2") ?? "";

  const [s1, setS1] = useState(paramS1);
  const [s2, setS2] = useState(paramS2);

  const { data: transcripts, isLoading: loadingList } = useTranscripts();

  const canCompare = Boolean(s1 && s2 && s1 !== s2);
  const showResult = Boolean(paramS1 && paramS2 && paramS1 !== paramS2);

  function handleCompare() {
    if (!canCompare) return;
    router.push(`/compare?session1=${s1}&session2=${s2}`);
  }

  return (
    <div className="px-8 py-8 flex flex-col gap-8 max-w-5xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Columns2 className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Compare Sessions</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          Select two sessions to compare metrics, strengths, and weaknesses side by side.
        </p>
      </div>

      {/* Picker */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-6 flex flex-col gap-5">
        <p className="text-sm font-semibold text-gray-800">Choose Sessions</p>

        {loadingList ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <SessionPicker
              label="Session 1"
              value={s1}
              onChange={setS1}
              transcripts={transcripts ?? []}
              exclude={s2}
            />
            <SessionPicker
              label="Session 2"
              value={s2}
              onChange={setS2}
              transcripts={transcripts ?? []}
              exclude={s1}
            />
          </div>
        )}

        <button
          disabled={!canCompare}
          onClick={handleCompare}
          className={cn(
            "self-end flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
            canCompare
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          Compare
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Result */}
      {showResult && <ComparisonResult session1={paramS1} session2={paramS2} />}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-8 flex flex-col gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      }
    >
      {comparePageInner()}
    </Suspense>
  );
}
