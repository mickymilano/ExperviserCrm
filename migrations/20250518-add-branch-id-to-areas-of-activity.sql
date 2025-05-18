-- Aggiungo la colonna branch_id alla tabella areas_of_activity
ALTER TABLE areas_of_activity 
ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

-- Aggiorno l'indice
CREATE INDEX IF NOT EXISTS idx_areas_of_activity_branch_id ON areas_of_activity(branch_id);

-- Commento per il log 
COMMENT ON COLUMN areas_of_activity.branch_id IS 'ID della filiale associata al contatto in questa area di attività';