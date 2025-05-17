-- Aggiunta del campo branch_id alla tabella deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);