import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  get_transcript_by_id,
  list_transcripts,
  delete_transcript,
} from "../db/transcript-queries";
import { get_analysis_by_transcript } from "../db/analysis-queries";
import { ok, err } from "../utils/index";

// ── Param schema ──────────────────────────────────────────────────────────────
const IdParamSchema = z.object({
  id: z.string().check(z.uuid()),
});

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
    const params = IdParamSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json(err(params.error.issues[0].message));
      return;
    }

    const transcript = await get_transcript_by_id(params.data.id);
    if (!transcript) {
      res.status(404).json(err("Transcript not found"));
      return;
    }

    const analysis = await get_analysis_by_transcript(params.data.id);
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
    const params = IdParamSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json(err(params.error.issues[0].message));
      return;
    }

    const transcript = await get_transcript_by_id(params.data.id);
    if (!transcript) {
      res.status(404).json(err("Transcript not found"));
      return;
    }

    await delete_transcript(params.data.id);
    res.json(ok({ deleted: params.data.id }));
  } catch (e) {
    next(e);
  }
}
