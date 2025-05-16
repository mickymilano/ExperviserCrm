-- Aggiungiamo la colonna managers alla tabella branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS managers JSONB DEFAULT '[]' NOT NULL;