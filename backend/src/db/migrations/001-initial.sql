CREATE TABLE IF NOT EXISTS transcripts (
  id            TEXT PRIMARY KEY,
  filename      TEXT NOT NULL,
  source        TEXT NOT NULL,
  raw_content   TEXT NOT NULL,
  messages      JSONB NOT NULL,
  message_count INTEGER NOT NULL,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id               TEXT PRIMARY KEY,
  transcript_id    TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  segments         JSONB NOT NULL,      -- Segment[] (includes per-segment scores + commentary)
  overall_scores   JSONB NOT NULL,      -- Record<metric, { score, confidence, rationale }>
  snapshot_summary TEXT NOT NULL,
  strengths        JSONB NOT NULL,      -- string[]
  improvements     JSONB NOT NULL,      -- string[]
  workflow_pattern TEXT,
  model_used       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
