import { Router } from "express";
import {
  upload,
  upload_transcript,
  get_all_transcripts,
  get_transcript,
  remove_transcript,
} from "../controllers/transcript-controller";

export const api_router = Router();

// transcript endpoints
api_router.post("/transcripts/upload",  upload.single("file"), upload_transcript);
api_router.get ("/transcripts",         get_all_transcripts);
api_router.get ("/transcripts/:id",     get_transcript);
api_router.delete("/transcripts/:id",  remove_transcript);
