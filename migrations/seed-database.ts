import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { hash } from 'bcrypt';

// Configura il websocket constructor per la connessione Neon
neonConfig.webSocketConstructor = ws;

// Configurazione del client PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  console.log("Inizializzazione del seed del database...");
  const client = await pool.connect();
  
  try {
    // Utilizziamo le transazioni per garantire l'integrità del processo
    await client.query('BEGIN');

    // 1. Pulizia dei dati esistenti (mantenendo l'utente superadmin)
    console.log("Pulizia delle tabelle esistenti...");
    
    await client.query(`DELETE FROM synergies`);
    await client.query(`DELETE FROM deals`);
    await client.query(`DELETE FROM areas_of_activity`);
    await client.query(`DELETE FROM contact_emails`);
    await client.query(`DELETE FROM leads`);
    await client.query(`DELETE FROM contacts`);
    await client.query(`DELETE FROM companies`);
    
    // Verifica la presenza dell'utente superadmin
    const adminResult = await client.query(`
      SELECT * FROM users WHERE email = 'michele@experviser.com' AND role = 'super_admin'
    `);
    
    // Se l'utente superadmin non esiste, lo creiamo
    if (adminResult.rows.length === 0) {
      console.log("Creazione dell'utente superadmin...");
      const hashedPassword = await hash('admin_admin_69', 10);
      await client.query(`
        INSERT INTO users (username, password, full_name, email, role, status, created_at, updated_at)
        VALUES ('michele', $1, 'Michele Admin', 'michele@experviser.com', 'super_admin', 'active', NOW(), NOW())
      `, [hashedPassword]);
    } else {
      console.log("L'utente superadmin esiste già");
    }
    
    // Crea un utente aggiuntivo (per test)
    const regularUserResult = await client.query(`
      SELECT * FROM users WHERE email = 'user@experviser.com'
    `);
    
    if (regularUserResult.rows.length === 0) {
      console.log("Creazione di un utente regolare per i test...");
      const hashedPassword = await hash('user1234', 10);
      await client.query(`
        INSERT INTO users (username, password, full_name, email, role, status, created_at, updated_at)
        VALUES ('user', $1, 'Utente Test', 'user@experviser.com', 'user', 'active', NOW(), NOW())
      `, [hashedPassword]);
    }
    
    // 2. Verifica e crea le fasi della pipeline
    const pipelineResult = await client.query(`SELECT * FROM pipeline_stages`);
    
    if (pipelineResult.rows.length === 0) {
      console.log("Creazione delle fasi della pipeline...");
      
      const pipelineStages = [
        { name: 'Lead', order: 1 },
        { name: 'Qualificato', order: 2 },
        { name: 'Incontro', order: 3 },
        { name: 'Proposta', order: 4 },
        { name: 'Negoziazione', order: 5 },
        { name: 'Vinto', order: 6 },
        { name: 'Perso', order: 7 }
      ];
      
      for (const stage of pipelineStages) {
        await client.query(`
          INSERT INTO pipeline_stages (name, order)
          VALUES ($1, $2)
        `, [stage.name, stage.order]);
      }
    } else {
      console.log(`${pipelineResult.rows.length} fasi pipeline esistenti`);
    }
    
    // 3. Creazione delle aziende di esempio
    console.log("Creazione delle aziende di esempio...");
    
    const company1Result = await client.query(`
      INSERT INTO companies (name, email, phone, address, industry, website, tags, notes, 
                            status, is_active_rep, company_type, brands, channels, products_or_services_tags, 
                            location_types, created_at, updated_at)
      VALUES ('ABC Consulting', 'info@abcconsulting.com', '+39 02 1234567', 'Via Roma 123, Milano', 
             'Consulenza', 'https://www.abcconsulting.com', 
             ARRAY['consulenza', 'strategia', 'innovazione'], 
             'Azienda di consulenza strategica',
             'active', true, 'independent', 
             ARRAY['ABC Consulting', 'ABC Advisory'], 
             ARRAY['Retail', 'Online'], 
             ARRAY['Consulenza Strategica', 'Digital Transformation', 'Change Management'],
             ARRAY['Ufficio', 'Flagship Store'], NOW(), NOW())
      RETURNING id
    `);
    
    const company2Result = await client.query(`
      INSERT INTO companies (name, email, phone, address, industry, website, tags, notes, 
                            status, is_active_rep, company_type, brands, channels, products_or_services_tags, 
                            location_types, created_at, updated_at)
      VALUES ('XYZ Franchising', 'info@xyzfranchising.com', '+39 06 9876543', 'Via Veneto 456, Roma', 
             'Franchising', 'https://www.xyzfranchising.com', 
             ARRAY['franchising', 'ristoranti', 'food'], 
             'Catena di franchising per ristoranti',
             'active', false, 'mono_brand_franchisor', 
             ARRAY['XYZ Food', 'XYZ Express'], 
             ARRAY['Franchising', 'Direct Retail'], 
             ARRAY['Food & Beverage', 'Restaurant Chain', 'Fast Food'],
             ARRAY['Negozio', 'Ristorante'], NOW(), NOW())
      RETURNING id
    `);
    
    const company1Id = company1Result.rows[0].id;
    const company2Id = company2Result.rows[0].id;
    
    // 4. Creazione dei contatti di esempio
    console.log("Creazione dei contatti di esempio...");
    
    const contact1Result = await client.query(`
      INSERT INTO contacts (first_name, last_name, mobile_phone, office_phone, notes, tags, roles, status, created_at, updated_at)
      VALUES ('Mario', 'Rossi', '+39 333 7654321', '+39 02 1234567', 
              'Contatto principale per ABC Consulting', 
              ARRAY['consulente', 'manager'], 
              ARRAY['CEO', 'Founder'], 
              'active', NOW(), NOW())
      RETURNING id
    `);
    
    const contact2Result = await client.query(`
      INSERT INTO contacts (first_name, last_name, mobile_phone, office_phone, notes, tags, roles, status, created_at, updated_at)
      VALUES ('Laura', 'Bianchi', '+39 333 8765432', '+39 06 9876543', 
              'Contatto marketing per XYZ Franchising', 
              ARRAY['marketing', 'digital'], 
              ARRAY['Marketing Director', 'Digital Strategist'], 
              'active', NOW(), NOW())
      RETURNING id
    `);
    
    const contact3Result = await client.query(`
      INSERT INTO contacts (first_name, last_name, mobile_phone, notes, tags, roles, status, created_at, updated_at)
      VALUES ('Giovanni', 'Verdi', '+39 333 9876543', 
              'Contatto per eventuali collaborazioni', 
              ARRAY['partner', 'consulente'], 
              ARRAY['Consultant', 'Business Developer'], 
              'active', NOW(), NOW())
      RETURNING id
    `);
    
    const contact1Id = contact1Result.rows[0].id;
    const contact2Id = contact2Result.rows[0].id;
    const contact3Id = contact3Result.rows[0].id;
    
    // 5. Inserimento delle email per i contatti
    console.log("Inserimento delle email per i contatti...");
    
    await client.query(`
      INSERT INTO contact_emails (contact_id, email_address, type, is_primary, created_at, updated_at)
      VALUES ($1, 'mario.rossi@abcconsulting.com', 'work', true, NOW(), NOW())
    `, [contact1Id]);
    
    await client.query(`
      INSERT INTO contact_emails (contact_id, email_address, type, is_primary, created_at, updated_at)
      VALUES ($1, 'mario.rossi@gmail.com', 'personal', false, NOW(), NOW())
    `, [contact1Id]);
    
    await client.query(`
      INSERT INTO contact_emails (contact_id, email_address, type, is_primary, created_at, updated_at)
      VALUES ($1, 'laura.bianchi@xyzfranchising.com', 'work', true, NOW(), NOW())
    `, [contact2Id]);
    
    await client.query(`
      INSERT INTO contact_emails (contact_id, email_address, type, is_primary, created_at, updated_at)
      VALUES ($1, 'g.verdi@consulenze.it', 'work', true, NOW(), NOW())
    `, [contact3Id]);
    
    await client.query(`
      INSERT INTO contact_emails (contact_id, email_address, type, is_primary, created_at, updated_at)
      VALUES ($1, 'giovanni.verdi@gmail.com', 'personal', false, NOW(), NOW())
    `, [contact3Id]);
    
    // 6. Associazione dei contatti alle aziende
    console.log("Associazione dei contatti alle aziende...");
    
    await client.query(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, role, is_primary, created_at, updated_at)
      VALUES ($1, $2, 'ABC Consulting', 'CEO', true, NOW(), NOW())
    `, [contact1Id, company1Id]);
    
    await client.query(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, role, is_primary, created_at, updated_at)
      VALUES ($1, $2, 'XYZ Franchising', 'Marketing Director', true, NOW(), NOW())
    `, [contact2Id, company2Id]);
    
    await client.query(`
      INSERT INTO areas_of_activity (contact_id, company_id, company_name, role, is_primary, created_at, updated_at)
      VALUES ($1, $2, 'ABC Consulting', 'External Consultant', true, NOW(), NOW())
    `, [contact3Id, company1Id]);
    
    // 7. Creazione dei lead di esempio
    console.log("Creazione dei lead di esempio...");
    
    await client.query(`
      INSERT INTO leads (first_name, last_name, company_email, mobile_phone, company_name, role, source, status, notes, created_at, updated_at)
      VALUES ('Paolo', 'Neri', 'paolo.neri@example.com', '+39 333 4567890', 
              'Nuova Azienda Srl', 'Direttore Commerciale', 'Website', 'New', 
              'Interessato ai servizi di consulenza strategica', NOW(), NOW())
    `);
    
    await client.query(`
      INSERT INTO leads (first_name, last_name, company_email, mobile_phone, company_name, role, source, status, notes, created_at, updated_at)
      VALUES ('Francesca', 'Gialli', 'francesca.gialli@example.com', '+39 333 5678901', 
              'Start-up Innovativa SpA', 'CEO', 'Referral', 'Qualified', 
              'Sta cercando partner per espandere il business', NOW(), NOW())
    `);
    
    // 8. Recupero degli ID delle fasi della pipeline
    const pipelineStagesResult = await client.query(`
      SELECT id, name FROM pipeline_stages ORDER BY "order"
    `);
    
    const stageMap = {};
    pipelineStagesResult.rows.forEach(stage => {
      stageMap[stage.name] = stage.id;
    });
    
    // 9. Creazione dei deals di esempio
    console.log("Creazione dei deals di esempio...");
    
    await client.query(`
      INSERT INTO deals (name, value, stage_id, company_id, contact_id, expected_close_date, notes, tags, status, created_at, updated_at)
      VALUES ('Progetto Consulenza Strategica', 50000, $1, $2, $3, 
              (NOW() + INTERVAL '2 months'), 
              'Cliente molto interessato, in attesa di approvazione budget', 
              ARRAY['strategia', 'ristrutturazione', 'high-value'], 
              'active', NOW(), NOW())
    `, [stageMap['Proposta'], company1Id, contact1Id]);
    
    const deal2Result = await client.query(`
      INSERT INTO deals (name, value, stage_id, company_id, contact_id, expected_close_date, notes, tags, status, created_at, updated_at)
      VALUES ('Apertura Nuova Sede Franchising', 25000, $1, $2, $3, 
              (NOW() + INTERVAL '1 month'), 
              'Dettagli contrattuali in fase di definizione', 
              ARRAY['franchising', 'expansion', 'retail'], 
              'active', NOW(), NOW())
      RETURNING id
    `, [stageMap['Negoziazione'], company2Id, contact2Id]);
    
    const deal2Id = deal2Result.rows[0].id;
    
    // 10. Creazione delle sinergie di esempio
    console.log("Creazione delle sinergie di esempio...");
    
    await client.query(`
      INSERT INTO synergies (deal_id, contact_id, company_id, status, type, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', 'business', NOW(), NOW())
    `, [deal2Id, contact3Id, company1Id]);
    
    await client.query('COMMIT');
    console.log("Seed del database completato con successo!");
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Errore durante il seed del database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch(err => {
  console.error("Errore fatale durante il seed:", err);
  process.exit(1);
});