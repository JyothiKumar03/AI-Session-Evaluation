import { z } from "zod";

// ── Shared metric keys ────────────────────────────────────────────────────────
const MetricScoresSchema = z.object({
  prompt_clarity:       z.number(),
  context_management:   z.number(),
  iteration_efficiency: z.number(),
  critical_thinking:    z.number(),
  error_recovery:       z.number(),
  ai_leverage:          z.number(),
  workflow_structure:   z.number(),
});

// ── Segment (phase block within a transcript) ─────────────────────────────────
export const SegmentSchema = z.object({
  phase: z.enum([
    "planning", "implementation", "debugging",
    "refactoring", "testing", "documentation",
    "clarification", "off-track",
  ]),
  message_range: z.object({
    start: z.number(),
    end:   z.number(),
  }),
  summary:       z.string(),
  signals: z.object({
    user_provided_context:      z.boolean(),
    user_had_clear_goal:        z.boolean(),
    ai_response_was_actionable: z.boolean(),
    user_reviewed_output:       z.boolean(),
  }),
  scores:     MetricScoresSchema,
  commentary: z.string(),
});

// ── Metric score with confidence ──────────────────────────────────────────────
export const MetricScoreSchema = z.object({
  score:      z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  rationale:  z.string(),
});

const OverallScoresSchema = z.object({
  prompt_clarity:       MetricScoreSchema,
  context_management:   MetricScoreSchema,
  iteration_efficiency: MetricScoreSchema,
  critical_thinking:    MetricScoreSchema,
  error_recovery:       MetricScoreSchema,
  ai_leverage:          MetricScoreSchema,
  workflow_structure:   MetricScoreSchema,
});

// ── Single unified extraction schema ─────────────────────────────────────────
export const AnalysisOutputSchema = z.object({
  segments:         z.array(SegmentSchema),
  overall_scores:   OverallScoresSchema,
  snapshot_summary: z.string(),
  strengths:        z.array(z.string()),
  improvements:     z.array(z.string()),
  workflow_pattern: z.enum(["plan-first", "dive-in", "iterative", "reactive", "exploratory"]),
});

export type Segment        = z.infer<typeof SegmentSchema>;
export type MetricScore    = z.infer<typeof MetricScoreSchema>;
export type OverallScores  = z.infer<typeof OverallScoresSchema>;
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

// ── AI service provider config ────────────────────────────────────────────────
export type AiProviderConfig = {
  provider:           "openai" | "openrouter";
  model:              string;
  max_output_tokens?: number;
};

// ── DB row shape ──────────────────────────────────────────────────────────────
export type AnalysisRow = {
  id:               string;
  transcript_id:    string;
  segments:         Segment[];
  overall_scores:   OverallScores;
  snapshot_summary: string;
  strengths:        string[];
  improvements:     string[];
  workflow_pattern: string | null;
  model_used:       string | null;
  created_at:       string;
};
