-- Crea la tabella per le firme email
CREATE TABLE IF NOT EXISTS email_signatures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crea la tabella per associare firme a account email
CREATE TABLE IF NOT EXISTS email_account_signatures (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  signature_id INTEGER NOT NULL REFERENCES email_signatures(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  CONSTRAINT account_signature_unique_idx UNIQUE(account_id, signature_id)
);

-- Crea indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS email_signatures_user_id_idx ON email_signatures(user_id);
CREATE INDEX IF NOT EXISTS email_account_signatures_account_id_idx ON email_account_signatures(account_id);
CREATE INDEX IF NOT EXISTS email_account_signatures_signature_id_idx ON email_account_signatures(signature_id);