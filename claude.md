# SOP Rules — AI Coding Session Evaluator

## Naming Conventions

### Backend (`backend/`)

| Thing              | Convention   | Example                          |
|--------------------|--------------|----------------------------------|
| Functions          | `snake_case` | `get_transcript_by_id()`         |
| Variables          | `snake_case` | `const job_id = ...`             |
| Types / Interfaces | `camelCase`  | `type JobStatus`, `type Message` |
| Zod schemas        | `camelCase`  | `const MessageSchema = z.object` |
| File names         | `kebab-case` | `transcript-queries.ts`          |

### Frontend (`frontend/`)

| Thing              | Convention   | Example                          |
|--------------------|--------------|----------------------------------|
| Components         | `camelCase`  | `function radarChart()`          |
| Variables          | `camelCase`  | `const transcriptId = ...`       |
| Functions / hooks  | `camelCase`  | `useTranscripts()`, `fetchData()`|
| Types / Interfaces | `camelCase`  | `type TranscriptDetail`          |
| File names         | `kebab-case` | `radar-chart.tsx`, `use-transcripts.ts` |

---

## Exports & Imports

- **Default export** for: components, route handlers, service objects, parsers, pipeline modules.
- **Named exports** (`export { }`) for: types, Zod schemas, constants, utility functions.
- Never mix — a file either has one default export or named exports (not both, unless types alongside a default).

```typescript
// Good — service with default export + named types
export type JobStatus = "queued" | "running" | "complete" | "failed";

const job_queue = { ... };
export default job_queue;
```

```typescript
// Good — types file with named exports only
export type Message = z.infer<typeof MessageSchema>;
export const MessageSchema = z.object({ ... });
```

```typescript
// Import style
import job_queue from "./jobs/job-queue";           // default
import { MessageSchema, type Message } from "./types/transcript"; // named
```

---

## File Responsibilities

### Backend entry points

- **`backend/app.ts`** — creates the Hono app, registers all middleware and routes. Nothing else.
- **`backend/index.ts`** — imports app, starts the HTTP server. Nothing else.

```typescript
// app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./src/routes";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());
app.route("/api", apiRouter);
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
```

```typescript
// index.ts
import { serve } from "@hono/node-server";
import app from "./app";
import { ENV } from "./src/constants/env";

serve({ fetch: app.fetch, port: ENV.PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
```

### Backend layers (strict separation)

- **`routes/`** — HTTP routing only, delegates to controllers.
- **`controllers/`** — request parsing, response shaping, calls services.
- **`services/`** — business logic (parsing, analysis, AI calls). No HTTP here.
- **`db/`** — raw SQL queries only. No business logic.
- **`types/`** — Zod schemas + inferred TypeScript types. No logic.

### Frontend layers

- **`pages/`** — route-level components, compose smaller components, use hooks for data.
- **`components/`** — presentational, receive props, no direct API calls.
- **`hooks/`** — TanStack Query hooks, data fetching logic.
- **`services/api.ts`** — all fetch calls to the backend, typed wrappers.
- **`types/`** — TypeScript types only, mirror backend shapes.

---

## Transcript Message Format

Claude Code transcripts are JSON arrays where each object has:
```json
{ "role": "user" | "assistant", "content": "...", "type": "tool_use" | undefined }
```
When `type === "tool_use"`, treat `role` as `"tool"`.
