# AI Workflow Evaluator — Architecture

## 1. What We're Building

A tool that answers: **"How effectively is this engineer using AI during development?"**

The system ingests raw AI coding transcripts, runs them through an LLM-powered analysis pipeline, persists structured results in NeonDB (Postgres), and serves them via a React dashboard.

---

## 2. High-Level Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────┐     ┌──────────┐
│  Raw Files   │────▶│  Normalizer  │────▶│  LLM Analyzer   │────▶│  NeonDB  │────▶│  React   │
│ (.json/.md/  │     │  (unified    │     │  (2-pass:       │     │ Postgres │     │ Dashboard│
│  .txt)       │     │   schema)    │     │   segment →     │     │          │     │          │
└─────────────┘     └──────────────┘     │   evaluate)     │     └──────────┘     └──────────┘
                                          └─────────────────┘
```

**In words:**
1. User uploads transcript files via the React UI.
2. **Normalizer** (backend service) detects format, parses into a unified message array.
3. **LLM Analyzer** processes normalized messages in two passes — segmentation then scoring.
4. **NeonDB** persists everything — transcripts, analyses, job status.
5. **React** renders the dashboard, transcript deep-dives, and comparisons.

---

## 3. Tech Stack

| Layer           | Choice                            | Why                                                        |
|-----------------|-----------------------------------|------------------------------------------------------------|
| **Runtime**     | Node.js + TypeScript              | Type safety, single language across stack                  |
| **Backend**     | Hono (on Node)                    | Lightweight, fast, first-class TypeScript support          |
| **Database**    | NeonDB (Serverless Postgres)      | Serverless, scales to zero, proper SQL, free tier          |
| **DB Client**   | `@neondatabase/serverless` (raw SQL) | No ORM overhead — `neon()` tagged template SQL queries  |
| **AI**          | Vercel AI SDK (`ai` package)      | Structured output, streaming, model-agnostic               |
| **AI Models**   | Claude Sonnet (primary) + GPT-4o (fallback) | Fallback handled in `ai-service` with retry logic |
| **Validation**  | Zod                               | Runtime type validation shared across backend              |
| **Frontend**    | React + Vite + Tailwind           | Fast dev experience, no SSR needed for this use case       |
| **Charts**      | Recharts                          | React-native, handles radar/bar/timeline well              |
| **File Upload** | react-dropzone + multer           | Drag-and-drop UX, server-side file handling                |
| **HTTP Client** | Axios / fetch                     | Standard REST calls to backend API                         |
| **State**       | TanStack Query (React Query)      | Server state management, caching, polling for async jobs   |

---

## 4. Transcript Ingestion & Normalization

### 4.1 The Problem

Every AI tool exports differently:
- **ChatGPT**: `conversations.json` — nested, with `mapping` objects
- **Claude Code**: JSONL / JSON with `{role, content, type}` fields — `type` may be `tool_use`
- **Cursor**: Exported text/markdown with `Human:` / `Assistant:` headers
- **Generic**: Plain markdown with `## User` / `## Assistant` headers

### 4.2 Unified Message Schema (Zod)

Everything normalizes to this — defined in `backend/src/types/transcript.ts`:

```typescript
import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string(),
  timestamp: z.string().nullable(),
  index: z.number(),
});

export const NormalizedTranscriptSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(["chatgpt", "claude_code", "cursor", "generic"]),
  filename: z.string(),
  messages: z.array(MessageSchema),
  metadata: z.record(z.unknown()),
});

export type Message = z.infer<typeof MessageSchema>;
export type NormalizedTranscript = z.infer<typeof NormalizedTranscriptSchema>;
```

> **Claude Code transcripts** are JSON arrays of `{role, content, type?}` objects.
> When `type === "tool_use"`, map `role` to `"tool"` and extract the tool name into content.

### 4.3 Parser Registry

Each format gets its own parser, auto-detected by file content:

```typescript
// backend/src/services/ingestion/parser-registry.ts

interface TranscriptParser {
  can_handle(content: string, filename: string): boolean;
  parse(content: string, filename: string): NormalizedTranscript;
}

const parsers: TranscriptParser[] = [
  new ChatGPTParser(),
  new ClaudeCodeParser(),
  new CursorParser(),
  new GenericMarkdownParser(), // fallback
];

export function detect_and_parse(content: string, filename: string): NormalizedTranscript {
  const parser = parsers.find((p) => p.can_handle(content, filename));
  if (!parser) throw new Error(`Unsupported format: ${filename}`);
  return parser.parse(content, filename);
}
```

Detection heuristics:
- **ChatGPT** → JSON with top-level `"mapping"` key
- **Claude Code** → JSON array where items have `"role"` and optionally `"type": "tool_use"`
- **Cursor** → text/markdown with `Human:` / `Assistant:` markers
- **Fallback** → any other text/markdown

Parsers are **lenient** — skip unparseable messages, log warnings, keep going.

---

## 5. LLM Analysis Pipeline

Two-pass analysis separating structure from evaluation.

### 5.1 Pass 1 — Segmentation & Phase Detection

**Input**: Full normalized message array, formatted with indices.

**Prompt**: Ask the LLM to group messages into labeled phases.

```
Phases: planning | implementation | debugging | refactoring | testing | documentation | clarification | off-track
```

**Output** (validated with Zod):

```typescript
// backend/src/types/analysis.ts

export const SegmentSchema = z.object({
  phase: z.enum([
    "planning", "implementation", "debugging", "refactoring",
    "testing", "documentation", "clarification", "off-track",
  ]),
  message_range: z.object({ values: z.tuple([z.number(), z.number()])}),
  summary: z.string(),
  signals: z.object({
    user_provided_context: z.boolean(),
    user_had_clear_goal: z.boolean(),
    ai_response_was_actionable: z.boolean(),
    user_reviewed_output: z.boolean(),
  }),
});

export const Pass1OutputSchema = z.object({
  segments: z.array(SegmentSchema),
});

export type Segment = z.infer<typeof SegmentSchema>;
export type Pass1Output = z.infer<typeof Pass1OutputSchema>;
```

### 5.2 Pass 2 — Evaluation & Scoring

**Input**: Segments from Pass 1 + original messages.

**Scoring dimensions** (1–10 scale, with confidence 0.0–1.0):

| Metric                  | What It Measures                                                   |
|-------------------------|--------------------------------------------------------------------|
| `prompt_clarity`        | Does the user give clear, specific instructions?                   |
| `context_management`    | Does the user maintain/provide relevant context across turns?      |
| `iteration_efficiency`  | How many turns to resolve a task? (adjusted for complexity)        |
| `critical_thinking`     | Does the user verify/question AI output, or blindly accept?        |
| `error_recovery`        | How well are errors/bugs handled?                                  |
| `ai_leverage`           | Is the AI used for high-value tasks, not trivial ones?             |
| `workflow_structure`    | Is there a logical flow (plan → implement → test)?                 |

**Output**:

```typescript
export const MetricScoreSchema = z.object({
  score: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export const Pass2OutputSchema = z.object({
  overall_scores: z.record(MetricScoreSchema),
  segment_scores: z.array(
    z.object({
      segment_index: z.number(),
      phase: z.string(),
      scores: z.record(z.number()),
      commentary: z.string(),
    })
  ),
  snapshot_summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  workflow_pattern: z.enum(["plan-first", "dive-in", "iterative", "reactive", "exploratory"]),
});

export type Pass2Output = z.infer<typeof Pass2OutputSchema>;
```

### 5.3 Why Two Passes?

1. **Separation of concerns** — segmentation is structural, evaluation is qualitative.
2. **Debuggability** — inspect segments independently of scores.
3. **Token efficiency** — Pass 2 references segments by index, not full message text.
4. **Extensibility** — swap scoring models or add metrics without touching segmentation.

### 5.4 Handling Long Transcripts

Most sessions are 50–200 messages (~20–40k tokens). Claude Sonnet's 200k context handles this easily. If a transcript exceeds limits:
- Split at natural phase boundaries.
- Run Pass 1 per chunk, merge segments.
- Run Pass 2 on merged segment list with representative messages.

---

## 6. AI Service (Vercel AI SDK + Retries + Fallback)

All LLM calls go through a single `ai-service` — **never call the Vercel AI SDK directly in pipeline code**.

```typescript
// backend/src/services/ai-service.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const PRIMARY_MODEL = anthropic("claude-sonnet-4-5");
const FALLBACK_MODEL = openai("gpt-4o");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function generate_with_retry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  use_fallback = false
): Promise<T> {
  const model = use_fallback ? FALLBACK_MODEL : PRIMARY_MODEL;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { object } = await generateObject({ model, prompt, schema });
      return object;
    } catch (err) {
      const is_last = attempt === MAX_RETRIES;
      if (is_last && !use_fallback) {
        // primary exhausted — try fallback model once
        return generate_with_retry(prompt, schema, true);
      }
      if (is_last) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error("unreachable");
}

export const ai_service = {
  generate_structured: generate_with_retry,
};
```

**Usage in pipeline:**

```typescript
import { ai_service } from "../services/ai-service";

const pass1_result = await ai_service.generate_structured(pass1_prompt, Pass1OutputSchema);
const pass2_result = await ai_service.generate_structured(pass2_prompt, Pass2OutputSchema);
```

---

## 7. Database (NeonDB — Raw SQL)

No ORM. Raw SQL via the `neon()` tagged-template client. Queries live in `backend/src/db/`.

### 7.1 Schema (SQL migrations)

```sql
-- backend/src/db/migrations/001-initial.sql

CREATE TABLE IF NOT EXISTS transcripts (
  id          TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  source      TEXT NOT NULL,               -- chatgpt | claude_code | cursor | generic
  raw_content TEXT NOT NULL,
  messages    JSONB NOT NULL,              -- Message[]
  message_count INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id               TEXT PRIMARY KEY,
  transcript_id    TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  segments         JSONB NOT NULL,          -- Pass1Output
  overall_scores   JSONB NOT NULL,          -- Pass2Output.overall_scores
  segment_scores   JSONB NOT NULL,          -- Pass2Output.segment_scores
  snapshot_summary TEXT NOT NULL,
  strengths        JSONB NOT NULL,          -- string[]
  improvements     JSONB NOT NULL,          -- string[]
  workflow_pattern TEXT,
  model_used       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'queued',  -- queued | running | complete | failed
  progress      TEXT,                             -- pass1 | pass2 | done
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comparisons (
  id                 TEXT PRIMARY KEY,
  transcript_ids     JSONB NOT NULL,              -- string[]
  comparison_summary TEXT NOT NULL,
  trend_data         JSONB NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 DB Client

```typescript
// backend/src/db/client.ts

import { neon } from "@neondatabase/serverless";
import { ENV } from "../constants/env";

export const sql = neon(ENV.DATABASE_URL);
```

### 7.3 Query Pattern

```typescript
// backend/src/db/transcript-queries.ts

import { sql } from "./client";
import type { NormalizedTranscript } from "../types/transcript";

export async function insert_transcript(data: NormalizedTranscript & { raw_content: string }) {
  await sql`
    INSERT INTO transcripts (id, filename, source, raw_content, messages, message_count)
    VALUES (
      ${data.id}, ${data.filename}, ${data.source},
      ${data.raw_content}, ${JSON.stringify(data.messages)}, ${data.messages.length}
    )
  `;
}

export async function get_transcript_by_id(id: string) {
  const rows = await sql`SELECT * FROM transcripts WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function list_transcripts() {
  return sql`SELECT id, filename, source, message_count, uploaded_at FROM transcripts ORDER BY uploaded_at DESC`;
}
```

---

## 8. API Design

### 8.1 Backend Routes (Hono — port 3001)

All routes registered in `backend/app.ts`. Server started in `backend/index.ts`.

```
POST   /api/transcripts              — Upload + parse transcript files (multipart)
GET    /api/transcripts              — List all transcripts
GET    /api/transcripts/:id          — Get transcript + normalized messages
DELETE /api/transcripts/:id          — Remove transcript (cascades to analyses/jobs)

POST   /api/jobs/analyze             — Kick off async analysis { transcriptId }
GET    /api/jobs/:id                 — Poll job status

GET    /api/transcripts/:id/analysis — Get analysis results
GET    /api/transcripts/:id/timeline — Phase timeline data for chart

POST   /api/compare                  — Compare multiple transcripts { transcriptIds[] }
GET    /api/compare/:id              — Get comparison result

GET    /api/dashboard/summary        — Aggregate stats across all sessions

GET    /health                       — Health check
```

### 8.2 Key Request / Response Shapes

**Upload:**
```typescript
// POST /api/transcripts — multipart/form-data files[]
// 200 Response
type UploadResponse = {
  transcripts: { id: string; filename: string; source: string; message_count: number }[];
};
```

**Trigger Analysis:**
```typescript
// POST /api/jobs/analyze — { transcript_id: string }
// 202 Response
type JobCreated = { job_id: string; status: "queued" };

// GET /api/jobs/:id
type JobStatus = {
  status: "queued" | "running" | "complete" | "failed";
  progress?: "pass1" | "pass2" | "done";
  result?: AnalysisResult;
  error?: string;
};
```

**Comparison:**
```typescript
// POST /api/compare — { transcript_ids: string[] }
// 202 Response: { comparison_id: string }
// GET /api/compare/:id — returns full comparison result
```

---

## 9. Frontend (React + Vite)

### 9.1 Route Structure

```
src/
├── main.tsx
├── app.tsx                          # Router + providers
├── pages/
│   ├── dashboard.tsx                # Aggregate stats, upload, transcript list
│   ├── transcript-detail.tsx        # Scores, timeline, segment deep-dive
│   └── compare.tsx                  # Side-by-side multi-transcript view
├── components/
│   ├── file-upload.tsx
│   ├── radar-chart.tsx
│   ├── phase-timeline.tsx
│   ├── score-card.tsx
│   ├── segment-detail.tsx
│   ├── transcript-list.tsx
│   ├── comparison-view.tsx
│   └── metric-trend.tsx
├── services/
│   └── api.ts                       # Typed fetch wrappers for backend
├── hooks/
│   └── use-transcripts.ts           # TanStack Query hooks
└── types/
    └── index.ts                     # Shared frontend types (mirrors backend Zod shapes)
```

### 9.2 Dashboard View

- Stat cards: total sessions, average score, most common workflow pattern
- Radar chart: average scores across all sessions
- Transcript list: click to deep-dive

### 9.3 Transcript Deep-Dive

- Radar chart (7 axes) with confidence shown as opacity
- Phase timeline: horizontal bar, click to expand segment detail
- Segment detail: phase label, score, rationale, message preview
- Strengths / improvements list

### 9.4 Comparison View

Select 2–3 transcripts → side-by-side radar charts, metric trend bars, generated narrative.

---

## 10. Project Structure

```
agent-session/
├── architecture.md
├── claude.md                        # SOP rules for this project
├── readme.md
│
├── backend/                         # Hono API server
│   ├── app.ts                       # Route registration
│   ├── index.ts                     # Server startup
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── constants/
│       │   └── env.ts               # Typed env vars
│       ├── types/
│       │   ├── transcript.ts        # Message, NormalizedTranscript (Zod + types)
│       │   └── analysis.ts          # Segment, Pass1Output, Pass2Output, JobStatus
│       ├── db/
│       │   ├── client.ts            # neon() SQL client
│       │   ├── transcript-queries.ts
│       │   ├── analysis-queries.ts
│       │   ├── job-queries.ts
│       │   └── migrations/
│       │       └── 001-initial.sql
│       ├── services/
│       │   ├── ai-service.ts        # Vercel AI SDK wrapper (retry + fallback)
│       │   ├── ingestion/
│       │   │   ├── parser-registry.ts
│       │   │   ├── chatgpt-parser.ts
│       │   │   ├── claude-code-parser.ts
│       │   │   ├── cursor-parser.ts
│       │   │   └── generic-parser.ts
│       │   └── analysis/
│       │       ├── pipeline.ts      # Orchestrates Pass 1 → Pass 2
│       │       ├── segmenter.ts     # Pass 1 — phase detection
│       │       ├── evaluator.ts     # Pass 2 — scoring
│       │       ├── prompts.ts       # All prompt templates
│       │       └── comparison.ts   # Multi-transcript comparison
│       ├── jobs/
│       │   └── job-queue.ts        # In-memory job queue + worker
│       ├── controllers/
│       │   ├── transcript-controller.ts
│       │   ├── job-controller.ts
│       │   ├── analysis-controller.ts
│       │   ├── compare-controller.ts
│       │   └── dashboard-controller.ts
│       ├── routes/
│       │   └── index.ts            # Assembles all route groups
│       ├── middlewares/
│       │   └── error-handler.ts
│       └── utils/
│           └── id.ts               # UUID generation
│
├── frontend/                        # React + Vite app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── main.tsx
│       ├── app.tsx
│       ├── pages/
│       ├── components/
│       ├── services/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
└── transcripts/                     # Real transcript files for testing
    ├── session1.json
    ├── session2.md
    └── session3.txt
```

---

## 11. Implementation Roadmap

### Phase 1 — Backend Core (Day 1)

```
□ NeonDB project → run 001-initial.sql migration
□ ENV constants, DB client, UUID util
□ Zod types: transcript.ts, analysis.ts
□ Parser registry + all 4 parsers
□ ai-service: retry + fallback wrapper
□ Pass 1 prompt + segmenter.ts
□ Pass 2 prompt + evaluator.ts
□ Pipeline: parse → Pass1 → Pass2 → store
□ Job queue: in-memory, async worker
□ All controllers + routes wired in app.ts
□ Test via curl / Postman with real transcripts
```

**Deliverable**: `POST /api/jobs/analyze` triggers full analysis and stores to NeonDB.

### Phase 2 — React Dashboard (Day 1–2)

```
□ Vite + React + Tailwind setup
□ Typed API service layer
□ TanStack Query hooks
□ Dashboard page: upload, stat cards, transcript list
□ Transcript detail: radar chart, phase timeline, segment detail
□ Loading skeletons, error states
□ Job polling: trigger → poll /api/jobs/:id → show results
```

**Deliverable**: Working web app — upload → analyze → browse results.

### Phase 3 — Comparison + Polish (Day 2–3)

```
□ Multi-transcript comparison endpoint + LLM prompt
□ ComparisonView: side-by-side radars, trend bars, narrative
□ Error boundaries, responsive layout
□ README with setup instructions
□ Final testing with all real transcripts
```

**Deliverable**: Complete submission.
