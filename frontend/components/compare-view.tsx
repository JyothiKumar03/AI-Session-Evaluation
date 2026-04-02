"use client";

import { cn } from "@/lib/utils";
import type { CompareData, MetricKey, OverallScores } from "@/types";
import {
  FileText,
  Star,
  TrendingDown,
  Trophy,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const METRIC_LABELS: Record<MetricKey, string> = {
  prompt_clarity: "Prompt Clarity",
  context_management: "Context Management",
  iteration_efficiency: "Iteration Efficiency",
  critical_thinking: "Critical Thinking",
  error_recovery: "Error Recovery",
  ai_leverage: "AI Leverage",
  workflow_structure: "Workflow Structure",
};

const METRICS: MetricKey[] = [
  "prompt_clarity",
  "context_management",
  "iteration_efficiency",
  "critical_thinking",
  "error_recovery",
  "ai_leverage",
  "workflow_structure",
];

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function overallScore(scores: OverallScores): number {
  const vals = METRICS.map((k) => scores[k].score);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-blue-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 8) return "bg-green-50 border-green-200";
  if (score >= 6) return "bg-blue-50 border-blue-200";
  if (score >= 4) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

// ── Session header card ───────────────────────────────────────────────────────

function sessionHeader(
  label: "Session 1" | "Session 2",
  transcript: CompareData["session1"]["transcript"],
  analysis: CompareData["session1"]["analysis"],
  avgScore: number
) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-foreground/10 p-5 flex flex-col gap-3">
      {/* Label badge */}
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>

      {/* Filename */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <FileText className="h-5 w-5 text-blue-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {transcript.filename}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-400">
              {sourceLabels[transcript.source] ?? transcript.source}
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">
              {transcript.message_count} msgs
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">
              {formatDate(transcript.uploaded_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Phase tag */}
      {analysis?.workflow_pattern && (
        <span
          className={cn(
            "w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize",
            workflowColors[analysis.workflow_pattern] ??
              "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          {analysis.workflow_pattern}
        </span>
      )}

      {/* Overall score */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 flex items-center justify-between",
          scoreBg(avgScore)
        )}
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Overall Score
        </span>
        <span className={cn("text-2xl font-bold", scoreColor(avgScore))}>
          {avgScore.toFixed(1)}
          <span className="text-sm font-normal text-gray-400">/10</span>
        </span>
      </div>
    </div>
  );
}

// ── Metric row score cell ─────────────────────────────────────────────────────

function scoreCell(
  score: number,
  isWinner: boolean,
  isTie: boolean
) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 min-w-0",
        isWinner && !isTie
          ? "bg-green-50 border-green-300"
          : "bg-gray-50 border-gray-200"
      )}
    >
      <span
        className={cn(
          "text-xl font-bold",
          isWinner && !isTie ? "text-green-600" : "text-gray-500"
        )}
      >
        {score}
      </span>
      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            score >= 8
              ? "bg-green-500"
              : score >= 6
              ? "bg-blue-500"
              : score >= 4
              ? "bg-amber-400"
              : "bg-red-400"
          )}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      {isWinner && !isTie && (
        <Trophy className="h-3 w-3 text-green-500" strokeWidth={2} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = { data: CompareData };

export default function compareView({ data }: Props) {
  const { session1, session2 } = data;
  const a1 = session1.analysis;
  const a2 = session2.analysis;

  const avg1 = a1 ? overallScore(a1.overall_scores) : 0;
  const avg2 = a2 ? overallScore(a2.overall_scores) : 0;

  const overallWinner =
    avg1 > avg2 ? 1 : avg2 > avg1 ? 2 : 0; // 0 = tie

  return (
    <div className="flex flex-col gap-8">
      {/* Overall winner banner */}
      {overallWinner !== 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-6 py-4 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-green-600 shrink-0" strokeWidth={2} />
          <div>
            <p className="font-semibold text-green-800 text-sm">
              Session {overallWinner} wins overall
            </p>
            <p className="text-xs text-green-600">
              {overallWinner === 1
                ? `${avg1.toFixed(1)} vs ${avg2.toFixed(1)} — +${(avg1 - avg2).toFixed(1)} pts`
                : `${avg2.toFixed(1)} vs ${avg1.toFixed(1)} — +${(avg2 - avg1).toFixed(1)} pts`}
            </p>
          </div>
        </div>
      )}

      {/* Session headers side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        {sessionHeader("Session 1", session1.transcript, a1, avg1)}
        {sessionHeader("Session 2", session2.transcript, a2, avg2)}
      </div>

      {/* Metrics comparison table */}
      {a1 && a2 && (
        <div className="rounded-2xl bg-white ring-1 ring-foreground/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Metric Scores
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Green cell = winner per metric
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {METRICS.map((key) => {
              const s1 = a1.overall_scores[key].score;
              const s2 = a2.overall_scores[key].score;
              const isTie = s1 === s2;
              const winner1 = s1 >= s2;
              const winner2 = s2 >= s1;

              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_120px_120px] items-center gap-3 px-5 py-3"
                >
                  {/* Metric name */}
                  <span className="text-sm font-medium text-gray-700">
                    {METRIC_LABELS[key]}
                  </span>
                  {/* Session 1 score */}
                  {scoreCell(s1, winner1, isTie)}
                  {/* Session 2 score */}
                  {scoreCell(s2, winner2, isTie)}
                </div>
              );
            })}
          </div>
          {/* Column headers pinned at bottom of table */}
          <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-2 border-t border-gray-100 bg-gray-50">
            <span />
            <span className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Session 1
            </span>
            <span className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Session 2
            </span>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {a1 && a2 && (
        <div className="grid grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="rounded-2xl bg-white ring-1 ring-foreground/10 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-500" strokeWidth={1.8} />
              <h2 className="text-sm font-semibold text-gray-900">Strengths</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Session 1", items: a1.strengths },
                { label: "Session 2", items: a2.strengths },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {label}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {items.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-gray-700"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-2xl bg-white ring-1 ring-foreground/10 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingDown
                className="h-5 w-5 text-amber-500"
                strokeWidth={1.8}
              />
              <h2 className="text-sm font-semibold text-gray-900">
                Areas to Improve
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Session 1", items: a1.improvements },
                { label: "Session 2", items: a2.improvements },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {label}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {items.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-gray-700"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fallback when one session lacks analysis */}
      {(!a1 || !a2) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 text-sm text-amber-700">
          One or both sessions are missing analysis data — scores cannot be
          compared.
        </div>
      )}
    </div>
  );
}
