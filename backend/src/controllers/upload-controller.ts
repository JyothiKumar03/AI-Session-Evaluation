import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { detect_and_parse } from "../services/ingestion/parser-registry";
import { run_analysis_pipeline } from "../services/analysis/pipeline";
import { insert_transcript } from "../db/transcript-queries";
import { ok, err } from "../utils/index";
import type { AiProviderConfig } from "../types/analysis";

// ── Multer: memory storage, accept single file ────────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Request body schema ───────────────────────────────────────────────────────
const AiProviderConfigSchema = z.object({
  provider: z.enum(["openai", "openrouter"]),
  model: z.string().check(z.minLength(1)),
  max_output_tokens: z.number().int().optional(),
});

const UploadBodySchema = z.object({
  ai_configs: z.string().optional(),
});

function default_ai_configs(): AiProviderConfig[] {
  return [
    { provider: "openai", model: "gpt-4o-mini", max_output_tokens: 4096 },
    { provider: "openrouter", model: "openai/gpt-4o-mini-2024-07-18", max_output_tokens: 4096 },
  ];
}

// ── POST /api/transcripts/upload ──────────────────────────────────────────────
export async function upload_transcript(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      res.status(400).json(err("No file uploaded"));
      return;
    }

    const body = UploadBodySchema.safeParse(req.body);
    let ai_configs: AiProviderConfig[] = default_ai_configs();

    if (body.success && body.data.ai_configs) {
      const parsed = z.array(AiProviderConfigSchema).safeParse(
        JSON.parse(body.data.ai_configs)
      );
      if (parsed.success) ai_configs = parsed.data;
    }

    const raw_content = req.file.buffer.toString("utf-8");
    const filename = req.file.originalname;

    const transcript = detect_and_parse(raw_content, filename);

    if (transcript.messages.length === 0) {
      res.status(422).json(err("Could not extract any messages from file"));
      return;
    }

    await insert_transcript({ ...transcript, raw_content });

    const analysis = await run_analysis_pipeline(
      transcript.id,
      transcript.messages,
      ai_configs
    );

    res.status(201).json(
      ok({
        transcript: {
          id: transcript.id,
          filename: transcript.filename,
          source: transcript.source,
          message_count: transcript.messages.length,
        },
        analysis: {
          id: analysis.id,
          snapshot_summary: analysis.snapshot_summary,
          workflow_pattern: analysis.workflow_pattern,
          overall_scores: analysis.overall_scores,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          segments: analysis.segments,
          model_used: analysis.model_used,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}
