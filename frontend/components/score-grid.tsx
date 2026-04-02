"use client";

import type { MetricKey, MetricScore } from "@/types";
import { cn } from "@/lib/utils";
import { METRIC_META } from "@/constants/metrics";

function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-blue-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 8) return "bg-green-50 ring-green-200";
  if (score >= 6) return "bg-blue-50 ring-blue-200";
  if (score >= 4) return "bg-amber-50 ring-amber-200";
  return "bg-red-50 ring-red-200";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
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
  );
}

type Props = {
  scores: Record<MetricKey, MetricScore>;
};

export default function scoreGrid({ scores }: Props) {
  const metricKeys = Object.keys(METRIC_META) as MetricKey[];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metricKeys.map((key) => {
        const { label, Icon } = METRIC_META[key];
        const { score, confidence, rationale } = scores[key];

        return (
          <div
            key={key}
            className={cn("flex flex-col gap-3 rounded-xl ring-1 p-4", scoreBg(score))}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon
                  className={cn("h-6 w-6 shrink-0", scoreColor(score))}
                  strokeWidth={1.8}
                />
                <span className="text-xs font-medium text-gray-700 leading-tight">
                  {label}
                </span>
              </div>
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums leading-none",
                  scoreColor(score)
                )}
              >
                {score}
                <span className="text-xs font-normal text-gray-400">/10</span>
              </span>
            </div>

            <ScoreBar score={score} />

            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {rationale}
            </p>

            <div className="text-xs text-gray-400">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
