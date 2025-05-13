/**
 * Script ottimizzato per popolamento database con dati di test
 * Compatibile con lo schema attuale del database
 */

import { db } from './db';
import {
  contacts, companies, deals, synergies, leads
} from '../shared/schema';

async function seedTestData() {
  try {
    console.log('='.repeat(50));
    console.log('INIZIALIZZAZIONE DATI DI TEST');
    console.log('='.repeat(50));

    // Controllo se ci sono già dati nelle tabelle principali
    const contactsCount = await getTableCount('contacts');
    const companiesCount = await getTableCount('companies');
    const dealsCount = await getTableCount('deals');
    const leadsCount = await getTableCount('leads');
    const synergiesCount = await getTableCount('synergies');

    console.log(`Tabelle attuali:
    - Contatti: ${contactsCount}
    - Aziende: ${companiesCount}
    - Deal: ${dealsCount}
    - Lead: ${leadsCount}
    - Sinergie: ${synergiesCount}
    `);

    if (contactsCount > 0 && companiesCount > 0 && dealsCount > 0) {
      console.log('Il database contiene già dei dati. Uscita senza operazioni.');
      return;
    }

    // Ottieni gli stage pipeline esistenti
    const pipelineStages = await db.execute('SELECT id, name, order FROM pipeline_stages ORDER BY order');
    console.log(`Trovati ${pipelineStages.rows.length} stage della pipeline`);

    // 1. Crea aziende di test
    console.log('Creazione aziende di test...');
    
    // Inserimento dati compatibili con il db attuale
    const company1 = await db.execute(`
      INSERT INTO companies (name, industry, website, email, phone, address, city, region, country, tags, notes, status)
      VALUES ('FranchisingPlus SpA', 'Franchising', 'https://franchisingplus.it', 'info@franchisingplus.it', '+39 02 1234567', 'Via Roma 123', 'Milano', 'Lombardia', 'Italia', ARRAY['franchising', 'retail'], 'Azienda di franchising attiva nel settore retail', 'active')
      RETURNING id
    `);
    
    const company2 = await db.execute(`
      INSERT INTO companies (name, industry, website, email, phone, address, city, region, country, tags, notes, status)
      VALUES ('Ristoranti Italiani Srl', 'Ristorazione', 'https://ristorantiitaliani.it', 'info@ristorantiitaliani.it', '+39 06 7654321', 'Via Veneto 456', 'Roma', 'Lazio', 'Italia', ARRAY['ristorazione', 'food'], 'Catena di ristoranti italiani', 'active')
      RETURNING id
    `);
    
    console.log(`✓ Create ${company1.rows.length + company2.rows.length} aziende di test`);
    
    // 2. Crea contatti di test
    console.log('Creazione contatti di test...');
    
    const contact1 = await db.execute(`
      INSERT INTO contacts (first_name, last_name, email, mobile, phone, address, city, region, country, postal_code, tags, notes, status)
      VALUES ('Marco', 'Rossi', 'marco.rossi@franchisingplus.it', '+39 333 1234567', '+39 02 1234567', 'Via Roma 123', 'Milano', 'Lombardia', 'Italia', '20121', ARRAY['vip', 'decision maker'], 'CEO di FranchisingPlus', 'active')
      RETURNING id
    `);
    
    const contact2 = await db.execute(`
      INSERT INTO contacts (first_name, last_name, email, mobile, phone, address, city, region, country, postal_code, tags, notes, status)
      VALUES ('Laura', 'Bianchi', 'laura.bianchi@franchisingplus.it', '+39 335 9876543', '+39 02 1234568', 'Via Montenapoleone 10', 'Milano', 'Lombardia', 'Italia', '20121', ARRAY['marketing', 'franchising'], 'Direttore Marketing di FranchisingPlus', 'active')
      RETURNING id
    `);
    
    const contact3 = await db.execute(`
      INSERT INTO contacts (first_name, last_name, email, mobile, phone, address, city, region, country, postal_code, tags, notes, status)
      VALUES ('Giuseppe', 'Verdi', 'giuseppe.verdi@ristorantiitaliani.it', '+39 338 1122334', '+39 06 7654322', 'Via Veneto 456', 'Roma', 'Lazio', 'Italia', '00187', ARRAY['ristorazione', 'chef'], 'Responsabile sviluppo di Ristoranti Italiani', 'active')
      RETURNING id
    `);
    
    console.log(`✓ Creati ${contact1.rows.length + contact2.rows.length + contact3.rows.length} contatti di test`);
    
    // 3. Crea aree di attività (associazione contatti-aziende)
    console.log('Creazione aree di attività...');
    
    await db.execute(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, job_description, role, is_primary)
      VALUES (${contact1.rows[0].id}, ${company1.rows[0].id}, 'FranchisingPlus SpA', 'Amministratore Delegato', 'CEO', true)
    `);
    
    await db.execute(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, job_description, role, is_primary)
      VALUES (${contact2.rows[0].id}, ${company1.rows[0].id}, 'FranchisingPlus SpA', 'Direttore Marketing', 'CMO', true)
    `);
    
    await db.execute(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, job_description, role, is_primary)
      VALUES (${contact3.rows[0].id}, ${company2.rows[0].id}, 'Ristoranti Italiani Srl', 'Responsabile sviluppo', 'Direttore Sviluppo', true)
    `);
    
    console.log('✓ Create 3 aree di attività');
    
    // 4. Crea lead di test
    console.log('Creazione lead di test...');
    
    await db.execute(`
      INSERT INTO leads (first_name, last_name, email, phone, company, role, source, status, notes)
      VALUES ('Anna', 'Neri', 'anna.neri@retailsolutions.it', '+39 340 1234567', 'Retail Solutions', 'Direttore Commerciale', 'LinkedIn', 'new', 'Interessata a soluzioni di franchising')
    `);
    
    await db.execute(`
      INSERT INTO leads (first_name, last_name, email, phone, company, role, source, status, notes)
      VALUES ('Paolo', 'Gialli', 'paolo.gialli@foodinnovation.it', '+39 342 7654321', 'Food Innovation', 'Fondatore', 'Referral', 'qualified', 'Ha una catena di ristoranti in espansione')
    `);
    
    console.log('✓ Creati 2 lead di test');
    
    // 5. Crea deal di test
    console.log('Creazione deal di test...');
    
    const nextFollowUpDate1 = new Date();
    nextFollowUpDate1.setDate(nextFollowUpDate1.getDate() + 7);
    
    const nextFollowUpDate2 = new Date();
    nextFollowUpDate2.setDate(nextFollowUpDate2.getDate() + 3);
    
    const expectedCloseDate1 = new Date();
    expectedCloseDate1.setDate(expectedCloseDate1.getDate() + 30);
    
    const expectedCloseDate2 = new Date();
    expectedCloseDate2.setDate(expectedCloseDate2.getDate() + 15);
    
    // Adatta i nomi delle colonne e i valori a quelli effettivamente esistenti nel database
    const deal1 = await db.execute(`
      INSERT INTO deals (name, value, stage_id, contact_id, company_id, expected_close_date, notes, tags, status, last_contacted_at, next_follow_up_at)
      VALUES ('Consulenza strategica FranchisingPlus', '15000', ${pipelineStages.rows[1].id}, ${contact1.rows[0].id}, ${company1.rows[0].id}, '${expectedCloseDate1.toISOString().split('T')[0]}', 'Proposta di consulenza strategica per l\\'espansione della rete', ARRAY['franchising', 'consulenza', 'strategia'], 'active', '${new Date().toISOString()}', '${nextFollowUpDate1.toISOString()}')
      RETURNING id
    `);
    
    const deal2 = await db.execute(`
      INSERT INTO deals (name, value, stage_id, contact_id, company_id, expected_close_date, notes, tags, status, last_contacted_at, next_follow_up_at)
      VALUES ('Ristrutturazione menu Ristoranti Italiani', '8000', ${pipelineStages.rows[3].id}, ${contact3.rows[0].id}, ${company2.rows[0].id}, '${expectedCloseDate2.toISOString().split('T')[0]}', 'Ristrutturazione completa del menu e identity della catena', ARRAY['ristorazione', 'menu', 'brand'], 'active', '${new Date().toISOString()}', '${nextFollowUpDate2.toISOString()}')
      RETURNING id
    `);
    
    console.log('✓ Creati 2 deal di test');
    
    // 6. Crea sinergie di test
    console.log('Creazione sinergie di test...');
    
    await db.execute(`
      INSERT INTO synergies (contact_id, company_id, type, description, status, start_date, deal_id)
      VALUES (${contact1.rows[0].id}, ${company1.rows[0].id}, 'Leadership', 'CEO dell\\'azienda, responsabile delle decisioni strategiche', 'Active', '${new Date().toISOString().split('T')[0]}', ${deal1.rows[0].id})
    `);
    
    await db.execute(`
      INSERT INTO synergies (contact_id, company_id, type, description, status, start_date, deal_id)
      VALUES (${contact3.rows[0].id}, ${company2.rows[0].id}, 'Business Development', 'Responsabile delle strategie di sviluppo della catena', 'Active', '${new Date().toISOString().split('T')[0]}', ${deal2.rows[0].id})
    `);
    
    console.log('✓ Create 2 sinergie di test');
    
    console.log('='.repeat(50));
    console.log('INIZIALIZZAZIONE DATI DI TEST COMPLETATA CON SUCCESSO');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('ERRORE DURANTE LA CREAZIONE DEI DATI DI TEST:', error);
    throw error;
  }
}

async function getTableCount(tableName: string): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM ${tableName};`;
  const result = await db.execute(query);
  return parseInt(result.rows[0]?.count || '0');
}

// Esegui lo script
seedTestData()
  .then(() => {
    console.log('Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore durante l\'esecuzione dello script:', error);
    process.exit(1);
  });