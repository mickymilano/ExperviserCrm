// Script per testare l'impostazione e la persistenza del contatto primario
import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkPrimaryContact(companyId) {
  try {
    console.log(`\n======= Verifica contatto primario per azienda ${companyId} =======`);
    
    // Query per ottenere i dettagli dell'azienda
    const companyResult = await pool.query(`
      SELECT id, name, primary_contact_id
      FROM companies
      WHERE id = $1
    `, [companyId]);
    
    if (companyResult.rows.length === 0) {
      console.log(`Azienda con ID ${companyId} non trovata`);
      return;
    }
    
    const company = companyResult.rows[0];
    console.log(`Azienda: ${company.name} (ID: ${company.id})`);
    console.log(`primary_contact_id attuale: ${company.primary_contact_id || 'NULL'}`);
    
    if (company.primary_contact_id) {
      // Query per ottenere i dettagli del contatto primario
      const contactResult = await pool.query(`
        SELECT id, first_name, last_name, company_email
        FROM contacts
        WHERE id = $1
      `, [company.primary_contact_id]);
      
      if (contactResult.rows.length > 0) {
        const contact = contactResult.rows[0];
        console.log(`Contatto primario: ${contact.first_name} ${contact.last_name} (ID: ${contact.id})`);
      } else {
        console.log(`Contatto con ID ${company.primary_contact_id} non trovato nel database`);
      }
    }
    
    console.log("================================\n");
  } catch (error) {
    console.error('Errore durante la verifica:', error);
  }
}

async function setPrimaryContact(companyId, contactId) {
  try {
    console.log(`\n======= Impostazione contatto primario =======`);
    console.log(`Impostazione contatto ${contactId} come primario per azienda ${companyId}`);
    
    // Prima verifica lo stato attuale
    await checkPrimaryContact(companyId);
    
    // Aggiorna il contatto primario dell'azienda
    const updateResult = await pool.query(`
      UPDATE companies
      SET primary_contact_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, primary_contact_id
    `, [contactId, companyId]);
    
    if (updateResult.rows.length > 0) {
      console.log('Aggiornamento completato con successo');
      console.log('Dati dopo aggiornamento:', updateResult.rows[0]);
    } else {
      console.log('Nessuna riga aggiornata');
    }
    
    // Verifica se l'aggiornamento è stato persistito
    await checkPrimaryContact(companyId);
    
    console.log("================================\n");
  } catch (error) {
    console.error('Errore durante l\'impostazione:', error);
  }
}

async function main() {
  try {
    const companyId = parseInt(process.argv[2] || 9);
    const contactId = parseInt(process.argv[3] || 15);
    
    console.log(`Test per azienda ID ${companyId} e contatto ID ${contactId}`);
    
    // Verifica stato iniziale
    await checkPrimaryContact(companyId);
    
    // Imposta il contatto primario
    await setPrimaryContact(companyId, contactId);
    
    // Verifica dopo 2 secondi per assicurarsi che il valore sia persistito
    console.log('Attendo 2 secondi per verificare la persistenza...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkPrimaryContact(companyId);
    
    // Cleanup
    await pool.end();
    console.log('Test completato');
  } catch (error) {
    console.error('Errore durante il test:', error);
    await pool.end();
  }
}

// Esegui il test
main();