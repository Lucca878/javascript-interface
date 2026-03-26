-- PostgreSQL schema for participant session ingestion.
-- Primary key logic is session_id uniqueness for idempotent writes.

CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  prolific_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  json_object_name TEXT NOT NULL,
  csv_object_name TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  csv_row_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_prolific_id
  ON results (prolific_id);

CREATE INDEX IF NOT EXISTS idx_results_received_at
  ON results (received_at);

CREATE INDEX IF NOT EXISTS idx_results_payload_json_gin
  ON results USING GIN (payload_json);

GRANT ALL ON TABLE results TO study_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO study_app;
