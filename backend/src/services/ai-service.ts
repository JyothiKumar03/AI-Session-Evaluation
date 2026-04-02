import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { ENV } from "../constants/env";
import type { AiProviderConfig } from "../types/analysis";

// ── Provider factory ──────────────────────────────────────────────────────────
function get_model(config: AiProviderConfig) {
  if (config.provider === "openrouter") {
    console.log('APIKEY', ENV.OPENROUTER_API_KEY)
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey:  ENV.OPENROUTER_API_KEY,
      headers: {
        "HTTP-Referer":   "https://agent-session.local",
        "X-Title":        "agent-session",
      },
    });
    return openrouter(config.model);
  }

  // default: openai
  const openai = createOpenAI({ apiKey: ENV.OPENAI_API_KEY });
  return openai(config.model);
}

// ── Core: generate structured output with retry + chain fallback ──────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function try_with_retries<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  config: AiProviderConfig
): Promise<T> {
  let last_error: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = get_model(config);
      const { experimental_output } = await generateText({
        model,
        prompt,
        maxOutputTokens: config.max_output_tokens ?? 8000,
        output:          Output.object({ schema }),
      });
      return experimental_output;
    } catch (err) {
      last_error = err;
      console.warn(
        `[ai-service] attempt ${attempt}/${MAX_RETRIES} failed for ${config.provider}/${config.model}:`,
        err instanceof Error ? err.message : err
      );
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw last_error;
}

/**
 * generate_structured
 *
 * Tries each config in order. For each config, retries up to MAX_RETRIES times
 * before falling back to the next config in the array.
 *
 * @param prompt   - The full prompt string
 * @param schema   - Zod schema for structured output
 * @param configs  - Ordered array of provider configs (first = primary, rest = fallbacks)
 */
async function generate_structured<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  configs: AiProviderConfig[]
): Promise<{ result: T; used_config: AiProviderConfig }> {
  if (configs.length === 0) throw new Error("[ai-service] configs array is empty");

  let last_error: unknown;

  for (const config of configs) {
    try {
      const result = await try_with_retries(prompt, schema, config);
      return { result, used_config: config };
    } catch (err) {
      last_error = err;
      console.warn(
        `[ai-service] all retries exhausted for ${config.provider}/${config.model}, trying next fallback`
      );
    }
  }

  throw new Error(
    `[ai-service] all providers failed. Last error: ${last_error instanceof Error ? last_error.message : String(last_error)}`
  );
}

export default { generate_structured };
