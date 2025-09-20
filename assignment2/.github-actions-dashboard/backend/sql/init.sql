CREATE TABLE IF NOT EXISTS runs (
  id BIGINT PRIMARY KEY,
  status TEXT NOT NULL,
  conclusion TEXT,
  name TEXT,
  event TEXT,
  branch TEXT,
  actor TEXT,
  created_at TIMESTAMPTZ,
  run_started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  html_url TEXT,
  run_attempt INT,
  duration_seconds INT
);

CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_branch ON runs(branch);
CREATE INDEX IF NOT EXISTS idx_runs_conclusion ON runs(conclusion);
