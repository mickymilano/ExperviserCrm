BEGIN;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS email     TEXT,
  ADD COLUMN IF NOT EXISTS phone     TEXT;

COMMIT;