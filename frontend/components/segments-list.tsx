"use client";

import {
  Pencil,
  Code2,
  Bug,
  RefreshCw,
  FlaskConical,
  FileText,
  MessageCircleQuestion,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import type { Segment, SegmentPhase } from "@/types";
import { cn } from "@/lib/utils";

const phaseMeta: Record<
  SegmentPhase,
  { label: string; Icon: React.ElementType; color: string; bg: string }
> = {
  planning: {
    label: "Planning",
    Icon: Pencil,
    color: "text-violet-600",
    bg: "bg-violet-50 ring-violet-200",
  },
  implementation: {
    label: "Implementation",
    Icon: Code2,
    color: "text-blue-600",
    bg: "bg-blue-50 ring-blue-200",
  },
  debugging: {
    label: "Debugging",
    Icon: Bug,
    color: "text-red-600",
    bg: "bg-red-50 ring-red-200",
  },
  refactoring: {
    label: "Refactoring",
    Icon: RefreshCw,
    color: "text-amber-600",
    bg: "bg-amber-50 ring-amber-200",
  },
  testing: {
    label: "Testing",
    Icon: FlaskConical,
    color: "text-green-600",
    bg: "bg-green-50 ring-green-200",
  },
  documentation: {
    label: "Documentation",
    Icon: FileText,
    color: "text-gray-600",
    bg: "bg-gray-50 ring-gray-200",
  },
  clarification: {
    label: "Clarification",
    Icon: MessageCircleQuestion,
    color: "text-sky-600",
    bg: "bg-sky-50 ring-sky-200",
  },
  "off-track": {
    label: "Off-track",
    Icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50 ring-orange-200",
  },
};

function SignalPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
      )}
    >
      {active ? (
        <CheckCircle className="h-3 w-3" strokeWidth={2} />
      ) : (
        <X className="h-3 w-3" strokeWidth={2} />
      )}
      {label}
    </span>
  );
}

type Props = { segments: Segment[] };

export default function segmentsList({ segments }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {segments.map((segment, i) => {
        const meta = phaseMeta[segment.phase] ?? phaseMeta.clarification;
        const { Icon } = meta;

        return (
          <div
            key={i}
            className={cn("rounded-xl ring-1 p-5 flex flex-col gap-3", meta.bg)}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Icon
                className={cn("h-7 w-7 shrink-0", meta.color)}
                strokeWidth={1.8}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-semibold text-sm", meta.color)}>
                  {meta.label}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  msgs {segment.message_range.start}–{segment.message_range.end}
                </span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {segment.summary}
            </p>

            {/* Commentary */}
            {segment.commentary && (
              <p className="text-xs text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-3">
                {segment.commentary}
              </p>
            )}

            {/* Signals */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <SignalPill
                label="Clear goal"
                active={segment.signals.user_had_clear_goal}
              />
              <SignalPill
                label="Good context"
                active={segment.signals.user_provided_context}
              />
              <SignalPill
                label="Actionable AI"
                active={segment.signals.ai_response_was_actionable}
              />
              <SignalPill
                label="Reviewed output"
                active={segment.signals.user_reviewed_output}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
