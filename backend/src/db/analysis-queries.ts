import { sql } from "./client";
import type { AnalysisRow, AnalysisOutput } from "../types/analysis";

export async function insert_analysis(data: {
  id:            string;
  transcript_id: string;
  output:        AnalysisOutput;
  model_used:    string;
}): Promise<void> {
  const { output: o } = data;
  await sql`
    INSERT INTO analyses (
      id, transcript_id, segments, overall_scores,
      snapshot_summary, strengths, improvements, workflow_pattern, model_used
    ) VALUES (
      ${data.id},
      ${data.transcript_id},
      ${JSON.stringify(o.segments)},
      ${JSON.stringify(o.overall_scores)},
      ${o.snapshot_summary},
      ${JSON.stringify(o.strengths)},
      ${JSON.stringify(o.improvements)},
      ${o.workflow_pattern},
      ${data.model_used}
    )
  `;
}

export async function get_analysis_by_transcript(transcript_id: string): Promise<AnalysisRow | null> {
  const rows = await sql`SELECT * FROM analyses WHERE transcript_id = ${transcript_id}`;
  return (rows[0] as AnalysisRow) ?? null;
}

export async function get_analysis_by_id(id: string): Promise<AnalysisRow | null> {
  const rows = await sql`SELECT * FROM analyses WHERE id = ${id}`;
  return (rows[0] as AnalysisRow) ?? null;
}
