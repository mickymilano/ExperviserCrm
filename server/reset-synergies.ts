/**
 * Script per eliminare COMPLETAMENTE la tabella delle sinergie e ricrearla da zero
 * Questo script va eseguito una sola volta per risolvere definitivamente il problema
 * delle sinergie senza contatto associato
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import { pool } from './db-simple';

async function resetSynergies() {
  console.log("Avvio reset completo delle sinergie...");

  try {
    // 1. Drop della tabella synergies completamente (se esiste)
    await pool.query(`
      DROP TABLE IF EXISTS synergies CASCADE;
    `);
    console.log("Tabella synergies eliminata.");

    // 2. Crea una nuova tabella synergies con vincoli rigorosi
    await pool.query(`
      CREATE TABLE synergies (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        contact_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        deal_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        CONSTRAINT fk_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
        CONSTRAINT synergy_requires_contact CHECK (contact_id IS NOT NULL),
        CONSTRAINT synergy_requires_company CHECK (company_id IS NOT NULL),
        CONSTRAINT synergy_requires_deal CHECK (deal_id IS NOT NULL)
      );
    `);
    console.log("Nuova tabella synergies creata con vincoli rigorosi.");

    // 3. Crea indici per migliorare le prestazioni
    await pool.query(`
      CREATE INDEX idx_synergies_contact_id ON synergies(contact_id);
      CREATE INDEX idx_synergies_company_id ON synergies(company_id);
      CREATE INDEX idx_synergies_deal_id ON synergies(deal_id);
      CREATE INDEX idx_synergies_status ON synergies(status);
    `);
    console.log("Indici creati sulla tabella synergies.");

    console.log("Reset delle sinergie completato con successo!");
  } catch (error) {
    console.error("Errore durante il reset delle sinergie:", error);
  } finally {
    await pool.end();
  }
}

// Esegui il reset
resetSynergies().catch(console.error);