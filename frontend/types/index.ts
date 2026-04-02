// ── Shared API wrapper ────────────────────────────────────────────────────────
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ── Transcript types ──────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant" | "tool";

export type Message = {
  role: MessageRole;
  content: string;
  timestamp: string | null;
  index: number;
};

export type TranscriptSource = "claude_code" | "codex" | "generic";

export type TranscriptRow = {
  id: string;
  filename: string;
  source: TranscriptSource;
  raw_content: string;
  messages: Message[];
  message_count: number;
  uploaded_at: string;
};

// ── Analysis types ────────────────────────────────────────────────────────────
export type MetricKey =
  | "prompt_clarity"
  | "context_management"
  | "iteration_efficiency"
  | "critical_thinking"
  | "error_recovery"
  | "ai_leverage"
  | "workflow_structure";

export type MetricScore = {
  score: number;
  confidence: number;
  rationale: string;
};

export type OverallScores = Record<MetricKey, MetricScore>;

export type SegmentPhase =
  | "planning"
  | "implementation"
  | "debugging"
  | "refactoring"
  | "testing"
  | "documentation"
  | "clarification"
  | "off-track";

export type SegmentSignals = {
  user_provided_context: boolean;
  user_had_clear_goal: boolean;
  ai_response_was_actionable: boolean;
  user_reviewed_output: boolean;
};

export type SegmentScores = {
  prompt_clarity: number;
  context_management: number;
  iteration_efficiency: number;
  critical_thinking: number;
  error_recovery: number;
  ai_leverage: number;
  workflow_structure: number;
};

export type Segment = {
  phase: SegmentPhase;
  message_range: { start: number; end: number };
  summary: string;
  signals: SegmentSignals;
  scores: SegmentScores;
  commentary: string;
};

export type WorkflowPattern =
  | "plan-first"
  | "dive-in"
  | "iterative"
  | "reactive"
  | "exploratory";

export type AnalysisRow = {
  id: string;
  transcript_id: string;
  segments: Segment[];
  overall_scores: OverallScores;
  snapshot_summary: string;
  strengths: string[];
  improvements: string[];
  workflow_pattern: WorkflowPattern | null;
  model_used: string | null;
  created_at: string;
};

// ── Endpoint response shapes ──────────────────────────────────────────────────
export type UploadResponseData = {
  transcript: {
    id: string;
    filename: string;
    source: TranscriptSource;
    message_count: number;
  };
  analysis: {
    id: string;
    snapshot_summary: string;
    workflow_pattern: WorkflowPattern | null;
    overall_scores: OverallScores;
    strengths: string[];
    improvements: string[];
    segments: Segment[];
    model_used: string | null;
  };
};

export type TranscriptDetailData = {
  transcript: TranscriptRow;
  analysis: AnalysisRow | null;
};

// ── Compare endpoint response ─────────────────────────────────────────────────
export type CompareSessionData = {
  transcript: TranscriptRow;
  analysis: AnalysisRow | null;
};

export type CompareData = {
  session1: CompareSessionData;
  session2: CompareSessionData;
};
