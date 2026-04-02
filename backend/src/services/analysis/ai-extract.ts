import ai_service from "../ai-service";
import { build_extract_prompt } from "./prompts";
import { AnalysisOutputSchema } from "../../types/analysis";
import type { Message } from "../../types/transcript";
import type { AnalysisOutput, AiProviderConfig } from "../../types/analysis";

export async function extract_analysis(
  messages: Message[],
  configs: AiProviderConfig[]
): Promise<{ output: AnalysisOutput; model_label: string }> {
  const prompt = build_extract_prompt(messages);
  const { result, used_config } = await ai_service.generate_structured(
    prompt,
    AnalysisOutputSchema,
    configs
  );
  return {
    output:      result,
    model_label: `${used_config.provider}/${used_config.model}`,
  };
}
