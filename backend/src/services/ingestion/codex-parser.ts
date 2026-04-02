import type { Message, NormalizedTranscript } from "../../types/transcript";

/**
 * OpenAI Codex / TUI JSONL format:
 *   {"type":"session_meta","id":"...","model":"gpt-5","timestamp":"...","source":"tui"}
 *   {"type":"user_turn","content":"...","timestamp":"..."}
 *   {"type":"agent_response","content":"...","timestamp":"..."}
 *   {"type":"token_count","payload":{"input":1200,"output":340,"total":1540},"timestamp":"..."}
 *   {"type":"tool_call","tool":"bash","input":"cargo test","timestamp":"..."}
 */

export function can_handle_codex(content: string): boolean {
  try {
    const first_line = content.trim().split("\n")[0];
    const parsed = JSON.parse(first_line) as Record<string, unknown>;
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      ["session_meta", "user_turn", "agent_response"].includes(parsed.type as string)
    );
  } catch {
    return false;
  }
}

export function parse_codex(
  content: string,
  filename: string,
  id: string
): NormalizedTranscript {
  const lines = content.trim().split("\n").filter(Boolean);
  const messages: Message[] = [];
  const metadata: Record<string, unknown> = {};
  let index = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const type      = entry.type as string;
      const timestamp = (entry.timestamp as string | undefined) ?? null;

      if (type === "session_meta") {
        metadata.model     = entry.model;
        metadata.source    = entry.source;
        metadata.session_id = entry.id;
        continue;
      }

      if (type === "user_turn") {
        messages.push({
          role:      "user",
          content:   String(entry.content ?? ""),
          timestamp,
          index:     index++,
        });
      } else if (type === "agent_response") {
        messages.push({
          role:      "assistant",
          content:   String(entry.content ?? ""),
          timestamp,
          index:     index++,
        });
      } else if (type === "tool_call") {
        const tool  = String(entry.tool ?? "tool");
        const input = typeof entry.input === "string"
          ? entry.input
          : JSON.stringify(entry.input ?? "");
        messages.push({
          role:      "tool",
          content:   `[${tool}] ${input}`,
          timestamp,
          index:     index++,
        });
      }
      // skip token_count and other meta entries
    } catch {
      // skip unparseable lines
    }
  }

  return { id, source: "codex", filename, messages, metadata };
}
