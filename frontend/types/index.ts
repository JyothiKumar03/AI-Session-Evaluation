// ── Shared API wrapper ────────────────────────────────────────────────────────
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ── Enums (const objects for use as values + types) ───────────────────────────
export const MessageRole = {
  User: "user",
  Assistant: "assistant",
  Tool: "tool",
} as const;

export const TranscriptSource = {
  ClaudeCode: "claude_code",
  Codex: "codex",
  Generic: "generic",
} as const;

export const SegmentPhase = {
  Planning: "planning",
  Implementation: "implementation",
  Debugging: "debugging",
  Refactoring: "refactoring",
  Testing: "testing",
  Documentation: "documentation",
  Clarification: "clarification",
  OffTrack: "off-track",
} as const;

export const WorkflowPattern = {
  PlanFirst: "plan-first",
  DiveIn: "dive-in",
  Iterative: "iterative",
  Reactive: "reactive",
  Exploratory: "exploratory",
} as const;

export const MetricKey = {
  PromptClarity: "prompt_clarity",
  ContextManagement: "context_management",
  IterationEfficiency: "iteration_efficiency",
  CriticalThinking: "critical_thinking",
  ErrorRecovery: "error_recovery",
  AiLeverage: "ai_leverage",
  WorkflowStructure: "workflow_structure",
} as const;

// ── Derived types ─────────────────────────────────────────────────────────────
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];
export type TranscriptSource = (typeof TranscriptSource)[keyof typeof TranscriptSource];
export type SegmentPhase = (typeof SegmentPhase)[keyof typeof SegmentPhase];
export type WorkflowPattern = (typeof WorkflowPattern)[keyof typeof WorkflowPattern];
export type MetricKey = (typeof MetricKey)[keyof typeof MetricKey];

// ── Transcript types ──────────────────────────────────────────────────────────
export type Message = {
  role: MessageRole;
  content: string;
  timestamp: string | null;
  index: number;
};

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
export type MetricScore = {
  score: number;
  confidence: number;
  rationale: string;
};

export type OverallScores = Record<MetricKey, MetricScore>;

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
