# Architecture

## What it does

You upload an AI coding session transcript. The system parses it, runs it through an LLM, scores how effectively the engineer used AI, and stores everything in Postgres. The frontend lets you browse sessions and compare them.

---

## Data flow

```
Upload → Parse → Normalize → LLM Analysis → Store in DB → Serve via API
```

![alt text](assets/architecture.jpeg)

1. File comes in as a raw upload (JSON, JSONL, or markdown)
2. Parser detects the format and normalizes it into a unified message array
3. LLM analyzes the messages and returns scores + segments
4. Results go into NeonDB
5. API serves them to the React frontend

---

## Backend

### Stack

- **Runtime**: Bun + TypeScript
- **Framework**: Express
- **Database**: NeonDB (serverless Postgres), raw SQL — no ORM
- **AI**: Vercel AI SDK with OpenAI + OpenRouter as fallback
- **Validation**: Zod v4

---

### Layers

```
controllers/   — parse request, call service, return response
services/      — all business logic (parsing, AI calls, pipeline)
db/            — raw SQL queries only, no logic
types/         — Zod schemas + inferred TypeScript types
routes/        — just wires HTTP paths to controllers
```

Controllers don't touch the DB directly. Services don't know about HTTP. DB files are pure queries.

---

### Ingestion

Three parsers, tried in order:

**Claude Code** — detects by looking for `sessionId` + `type: "user"/"assistant"` in the first 20 JSON objects. Skips metadata events (`isMeta: true`), queue operations, file snapshots. Extracts text from content blocks, formats tool calls as `[tool_use:name] input`.

**Codex** — detects by checking if the first line of the file has `type: "session_meta" | "user_turn" | "agent_response"`. JSONL format, one entry per line. Skips `token_count` and other meta lines.

**Generic** — always the fallback. Scans for markdown headers like `## User`, `Human:`, `Claude:`, etc. and splits content by role.

All three produce the same output: an array of `{ role, content, timestamp, index }` messages.

---

### Analysis pipeline

One LLM call. The full normalized message array goes into a prompt that asks the model to return:

- **Segments** — contiguous phases of the session (planning, implementation, debugging, etc.) with per-segment scores and signals
- **Overall scores** — 7 metrics rated 1–10 with confidence and rationale
- **Summary, strengths, improvements** — plain text
- **Workflow pattern** — one of: plan-first, dive-in, iterative, reactive, exploratory

The output is validated with Zod before anything is stored.

The 7 metrics: `prompt_clarity`, `context_management`, `iteration_efficiency`, `critical_thinking`, `error_recovery`, `ai_leverage`, `workflow_structure`.

The prompt includes explicit rules: noise messages (slash commands, tool echoes, IDE injections) must still be assigned to a segment but shouldn't affect scores. Interruptions must lower efficiency scores. Nothing should be fabricated — if the AI didn't visibly do something, don't credit it.

---

### AI service

Wraps the Vercel AI SDK. Tries each provider config in order (currently OpenAI → OpenRouter). Retries up to 3 times per provider before moving to the next. Returns the result and which model was used.

---

### Database

Two tables:

**transcripts** — stores the raw file content, the normalized message array as JSONB, message count, source, and upload timestamp.

**analyses** — stores the full LLM output: segments, overall scores, summary, strengths, improvements, workflow pattern, and which model produced it. Foreign key to transcripts with cascade delete.

---

### API surface

```
POST   /api/transcripts/upload          upload + parse + analyze in one shot
GET    /api/transcripts                 list all sessions
GET    /api/transcripts/:id             get one session with its analysis
DELETE /api/transcripts/:id             delete session and its analysis
GET    /api/transcripts/compare         compare two sessions by query params
```
