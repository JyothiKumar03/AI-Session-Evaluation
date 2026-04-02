import { sql } from "./client";
import type { NormalizedTranscript, TranscriptRow } from "../types/transcript";

export async function insert_transcript(
  data: NormalizedTranscript & { raw_content: string }
): Promise<void> {
  await sql`
    INSERT INTO transcripts (id, filename, source, raw_content, messages, message_count)
    VALUES (
      ${data.id},
      ${data.filename},
      ${data.source},
      ${data.raw_content},
      ${JSON.stringify(data.messages)},
      ${data.messages.length}
    )
  `;
}

export async function get_transcript_by_id(id: string): Promise<TranscriptRow | null> {
  const rows = await sql`
    SELECT * FROM transcripts WHERE id = ${id}
  `;
  return (rows[0] as TranscriptRow) ?? null;
}

export async function list_transcripts(): Promise<Omit<TranscriptRow, "raw_content" | "messages">[]> {
  const rows = await sql`
    SELECT id, filename, source, message_count, uploaded_at
    FROM transcripts
    ORDER BY uploaded_at DESC
  `;
  return rows as Omit<TranscriptRow, "raw_content" | "messages">[];
}

export async function delete_transcript(id: string): Promise<void> {
  await sql`DELETE FROM transcripts WHERE id = ${id}`;
}
