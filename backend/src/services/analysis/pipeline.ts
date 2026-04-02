import { extract_analysis } from "./ai-extract";
import { insert_analysis } from "../../db/analysis-queries";
import { randomUUID } from "crypto";
import type { Message } from "../../types/transcript";
import type { AiProviderConfig, AnalysisRow } from "../../types/analysis";

export async function run_analysis_pipeline(
  transcript_id: string,
  messages: Message[],
  configs: AiProviderConfig[]
): Promise<AnalysisRow> {
  const { output, model_label } = await extract_analysis(messages, configs);

  const analysis_id = randomUUID();

  await insert_analysis({
    id:            analysis_id,
    transcript_id,
    output,
    model_used:    model_label,
  });

  return {
    id:               analysis_id,
    transcript_id,
    segments:         output.segments,
    overall_scores:   output.overall_scores,
    snapshot_summary: output.snapshot_summary,
    strengths:        output.strengths,
    improvements:     output.improvements,
    workflow_pattern: output.workflow_pattern,
    model_used:       model_label,
    created_at:       new Date().toISOString(),
  };
}
