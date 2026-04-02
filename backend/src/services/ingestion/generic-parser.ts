import type { Message, NormalizedTranscript } from "../../types/transcript";

/**
 * Generic fallback parser for markdown/text transcripts.
 * Recognises headers like:
 *   ## User / **User:** / Human: / You:
 *   ## Assistant / **Assistant:** / Assistant: / Claude:
 */

const USER_PATTERNS      = /^(##\s*user|human|you|\*\*user\*\*)[:\s]*/i;
const ASSISTANT_PATTERNS = /^(##\s*assistant|assistant|claude|\*\*assistant\*\*)[:\s]*/i;

export function can_handle_generic(): boolean {
  return true; // always the fallback
}

export function parse_generic(
  content: string,
  filename: string,
  id: string
): NormalizedTranscript {
  const lines = content.split("\n");
  const messages: Message[] = [];
  let index = 0;
  let current_role: "user" | "assistant" | null = null;
  let buffer: string[] = [];

  function flush() {
    if (current_role && buffer.length > 0) {
      const text = buffer.join("\n").trim();
      if (text) {
        messages.push({ role: current_role, content: text, timestamp: null, index: index++ });
      }
      buffer = [];
    }
  }

  for (const line of lines) {
    if (USER_PATTERNS.test(line.trim())) {
      flush();
      current_role = "user";
      const remainder = line.replace(USER_PATTERNS, "").trim();
      if (remainder) buffer.push(remainder);
    } else if (ASSISTANT_PATTERNS.test(line.trim())) {
      flush();
      current_role = "assistant";
      const remainder = line.replace(ASSISTANT_PATTERNS, "").trim();
      if (remainder) buffer.push(remainder);
    } else if (current_role) {
      buffer.push(line);
    }
  }
  flush();

  return { id, source: "generic", filename, messages, metadata: {} };
}
