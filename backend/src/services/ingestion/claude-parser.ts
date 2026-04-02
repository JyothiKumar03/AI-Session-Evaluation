import type { Message, NormalizedTranscript } from "../../types/transcript";

/**
 * Claude Code session format: multiple multi-line JSON objects concatenated.
 * Each object has a top-level "type" field. We only extract "user" and "assistant"
 * entries (skipping isMeta ones). Message content lives at entry.message.content.
 *
 * Example object shapes:
 *   {"type":"queue-operation","operation":"enqueue",...}          ← skip
 *   {"type":"user","message":{"role":"user","content":"..."},...} ← extract
 *   {"type":"assistant","message":{"role":"assistant","content":[...]},...} ← extract
 *   {"type":"file-history-snapshot",...}                          ← skip
 */

// ── helpers ───────────────────────────────────────────────────────────────────

function split_json_objects(content: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(content.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function extract_content(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v !== "object" || v === null) return "";
        const block = v as Record<string, unknown>;
        if (block.type === "text" && typeof block.text === "string") return block.text;
        if (block.type === "tool_use") {
          const name  = typeof block.name  === "string" ? block.name  : "tool";
          const input = block.input ? JSON.stringify(block.input) : "";
          return `[tool_use:${name}] ${input}`;
        }
        if (block.type === "tool_result") {
          return extract_content(block.content);
        }
        // skip thinking, image, etc.
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "");
}

// ── detection ─────────────────────────────────────────────────────────────────

export function can_handle_claude(content: string): boolean {
  try {
    const raw_objects = split_json_objects(content.trim());
    for (const raw of raw_objects.slice(0, 20)) {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof obj.sessionId === "string" &&
        (obj.type === "user" || obj.type === "assistant") &&
        typeof obj.message === "object" && obj.message !== null
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ── parser ────────────────────────────────────────────────────────────────────

export function parse_claude(
  content: string,
  filename: string,
  id: string
): NormalizedTranscript {
  const raw_objects = split_json_objects(content.trim());
  const messages: Message[] = [];
  let index = 0;

  for (const raw of raw_objects) {
    try {
      const entry = JSON.parse(raw) as Record<string, unknown>;
      const type  = entry.type as string;

      if (type !== "user" && type !== "assistant") continue;
      if (entry.isMeta === true) continue;

      const msg       = entry.message as { role?: string; content?: unknown } | undefined;
      const msg_content = msg?.content;
      if (msg_content === undefined || msg_content === null) continue;

      const timestamp = (entry.timestamp as string | undefined) ?? null;
      const text      = extract_content(msg_content).trim();
      if (!text) continue;

      messages.push({
        role:      type === "user" ? "user" : "assistant",
        content:   text,
        timestamp,
        index:     index++,
      });
    } catch {
      // skip unparseable objects
    }
  }

  return { id, source: "claude_code", filename, messages, metadata: {} };
}
