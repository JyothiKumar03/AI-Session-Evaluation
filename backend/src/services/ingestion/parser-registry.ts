import { can_handle_claude, parse_claude } from "./claude-parser";
import { can_handle_codex, parse_codex }   from "./codex-parser";
import { parse_generic }                    from "./generic-parser";
import type { NormalizedTranscript }        from "../../types/transcript";
import { randomUUID }                       from "crypto";

export function detect_and_parse(content: string, filename: string): NormalizedTranscript {
  const id = randomUUID();

  if (can_handle_claude(content)) return parse_claude(content, filename, id);
  if (can_handle_codex(content))  return parse_codex(content,  filename, id);

  // generic markdown fallback
  return parse_generic(content, filename, id);
}
