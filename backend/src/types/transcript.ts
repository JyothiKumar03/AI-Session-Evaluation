import { z } from "zod";

// ── Normalized message (unified shape across all sources) ─────────────────────
export const MessageSchema = z.object({
  role:      z.enum(["user", "assistant", "tool"]),
  content:   z.string(),
  timestamp: z.string().nullable(),
  index:     z.number(),
});

export const NormalizedTranscriptSchema = z.object({
  id:        z.string().uuid(),
  source:    z.enum(["claude_code", "codex", "generic"]),
  filename:  z.string(),
  messages:  z.array(MessageSchema),
  metadata:  z.record(z.string(), z.unknown()),
});

export type Message             = z.infer<typeof MessageSchema>;
export type NormalizedTranscript = z.infer<typeof NormalizedTranscriptSchema>;

// ── DB row shapes ─────────────────────────────────────────────────────────────
export type TranscriptRow = {
  id:            string;
  filename:      string;
  source:        string;
  raw_content:   string;
  messages:      Message[];
  message_count: number;
  uploaded_at:   string;
};
