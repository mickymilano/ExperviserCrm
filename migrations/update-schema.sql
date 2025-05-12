-- Creazione degli enum
CREATE TYPE IF NOT EXISTS email_type AS ENUM ('work', 'personal', 'previous_work', 'other');
CREATE TYPE IF NOT EXISTS company_type AS ENUM (
  'Independente', 
  'Basket Company Franchisor', 
  'Franchisor Monomarca', 
  'Multi-unit Franchisee', 
  'Master Franchisee', 
  'Gestore Centri Commerciali', 
  'Produttore', 
  'Grossista', 
  'Altro'
);

-- Rimuove la colonna email dai contatti (verrà gestita dalla nuova tabella contact_emails)
ALTER TABLE contacts DROP COLUMN IF EXISTS email;
ALTER TABLE contacts DROP COLUMN IF EXISTS companyEmail;
ALTER TABLE contacts DROP COLUMN IF EXISTS privateEmail;

-- Aggiungi campi mancanti ai contatti
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at timestamp;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_follow_up_at timestamp;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS roles jsonb;

-- Crea la nuova tabella contact_emails se non esiste
CREATE TABLE IF NOT EXISTS contact_emails (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  type email_type NOT NULL DEFAULT 'work',
  is_primary BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  UNIQUE(contact_id, email_address)
);

-- Aggiorna la tabella companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active_rep BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type company_type;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brands JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS channels JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS products_or_services_tags JSONB;

-- Aggiorna la tabella deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP;

-- Crea la tabella synergies se non esiste
CREATE TABLE IF NOT EXISTS synergies (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);