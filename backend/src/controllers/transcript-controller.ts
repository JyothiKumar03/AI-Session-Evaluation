import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { detect_and_parse } from "../services/ingestion/parser-registry";
import { run_analysis_pipeline } from "../services/analysis/pipeline";
import {
  insert_transcript,
  get_transcript_by_id,
  list_transcripts,
  delete_transcript,
} from "../db/transcript-queries";
import { get_analysis_by_transcript } from "../db/analysis-queries";
import { ok, err } from "../utils/index";
import type { AiProviderConfig } from "../types/analysis";

// ── Multer: memory storage, accept single file ────────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

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

    // AI provider configs from request body — fallback chain ordered by priority
    const ai_configs: AiProviderConfig[] = req.body.ai_configs
      ? JSON.parse(req.body.ai_configs as string)
      : default_ai_configs();

    const raw_content = req.file.buffer.toString("utf-8");
    const filename    = req.file.originalname;

    // 1. Parse transcript into normalized messages
    const transcript = detect_and_parse(raw_content, filename);

    if (transcript.messages.length === 0) {
      res.status(422).json(err("Could not extract any messages from file"));
      return;
    }

    // 2. Store transcript
    await insert_transcript({ ...transcript, raw_content });

    // 3. Run analysis (pass1 → pass2) and store results
    const analysis = await run_analysis_pipeline(
      transcript.id,
      transcript.messages,
      ai_configs
    );

    res.status(201).json(
      ok({
        transcript: {
          id:            transcript.id,
          filename:      transcript.filename,
          source:        transcript.source,
          message_count: transcript.messages.length,
        },
        analysis: {
          id:               analysis.id,
          snapshot_summary: analysis.snapshot_summary,
          workflow_pattern: analysis.workflow_pattern,
          overall_scores:   analysis.overall_scores,
          strengths:        analysis.strengths,
          improvements:     analysis.improvements,
          segments:         analysis.segments,
          model_used:       analysis.model_used,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}

// ── GET /api/transcripts ──────────────────────────────────────────────────────
export async function get_all_transcripts(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const transcripts = await list_transcripts();
    res.json(ok(transcripts));
  } catch (e) {
    next(e);
  }
}

// ── GET /api/transcripts/:id ──────────────────────────────────────────────────
export async function get_transcript(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const transcript = await get_transcript_by_id(String(req.params.id));
    if (!transcript) {
      res.status(404).json(err("Transcript not found"));
      return;
    }

    const analysis = await get_analysis_by_transcript(String(req.params.id));

    res.json(ok({ transcript, analysis }));
  } catch (e) {
    next(e);
  }
}

// ── DELETE /api/transcripts/:id ───────────────────────────────────────────────
export async function remove_transcript(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const transcript = await get_transcript_by_id(String(req.params.id));
    if (!transcript) {
      res.status(404).json(err("Transcript not found"));
      return;
    }
    await delete_transcript(String(req.params.id));
    res.json(ok({ deleted: String(req.params.id) }));
  } catch (e) {
    next(e);
  }
}

// ── Default AI config (can be overridden per request) ────────────────────────
function default_ai_configs(): AiProviderConfig[] {
  return [
    { provider: "openai",     model: "gpt-4o-mini",                max_output_tokens: 4096 },
    { provider: "openrouter", model: "openai/gpt-4o-mini-2024-07-18", max_output_tokens: 4096 },
  ];
}
