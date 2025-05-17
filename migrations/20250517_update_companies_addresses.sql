-- Migrazione per aggiornare il campo full_address con dati completi
-- assicurando che ogni azienda abbia un indirizzo completo
UPDATE companies
SET full_address = address
WHERE full_address IS NULL AND address IS NOT NULL;

-- Aggiorniamo il campo country dalle informazioni disponibili
UPDATE companies
SET country = 'Italia'
WHERE country IS NULL AND (
  address LIKE '%Roma%' OR 
  address LIKE '%Milano%' OR 
  address LIKE '%Torino%' OR 
  address LIKE '%Napoli%' OR 
  address LIKE '%Italia%'
);

UPDATE companies
SET country = 'USA'
WHERE country IS NULL AND (
  address LIKE '%New York%' OR 
  address LIKE '%California%' OR 
  address LIKE '%USA%' OR
  address LIKE '%United States%'
);

-- Set a default value for country if not available
UPDATE companies
SET country = 'Non specificato'
WHERE country IS NULL OR country = '';

-- Create a log message to help with debugging
INSERT INTO migration_logs (migration_name, message, executed_at)
VALUES 
  ('20250517_update_companies_addresses', 'Aggiornato full_address e country per la compatibilità con la nuova struttura dati', NOW());