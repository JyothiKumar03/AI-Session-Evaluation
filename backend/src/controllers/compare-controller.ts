import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { get_transcript_by_id } from "../db/transcript-queries";
import { get_analysis_by_transcript } from "../db/analysis-queries";
import { ok, err } from "../utils/index";

// ── Query schema ──────────────────────────────────────────────────────────────
const CompareQuerySchema = z.object({
  session1: z.string().check(z.uuid()),
  session2: z.string().check(z.uuid()),
});

// ── GET /api/transcripts/compare?session1=XX&session2=XX ─────────────────────
export async function compare_transcripts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = CompareQuerySchema.safeParse(req.query);

    if (!query.success) {
      res.status(400).json(err(query.error.issues[0].message));
      return;
    }

    const { session1, session2 } = query.data;

    const [t1, t2] = await Promise.all([
      get_transcript_by_id(session1),
      get_transcript_by_id(session2),
    ]);

    if (!t1) { res.status(404).json(err(`Session ${session1} not found`)); return; }
    if (!t2) { res.status(404).json(err(`Session ${session2} not found`)); return; }

    const [a1, a2] = await Promise.all([
      get_analysis_by_transcript(session1),
      get_analysis_by_transcript(session2),
    ]);

    res.json(ok({
      session1: { transcript: t1, analysis: a1 },
      session2: { transcript: t2, analysis: a2 },
    }));
  } catch (e) {
    next(e);
  }
}
