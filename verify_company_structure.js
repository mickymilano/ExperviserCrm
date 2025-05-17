import pg from 'pg';
const { Pool } = pg;

// Connessione al database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    console.log('Verifico la struttura della tabella "companies"...');
    
    // Verifica la struttura della tabella
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('Struttura tabella "companies":');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Verifica se le colonne city e region esistono ancora
    const cityExists = structureResult.rows.some(col => col.column_name === 'city');
    const regionExists = structureResult.rows.some(col => col.column_name === 'region');
    
    console.log(`\nColonna 'city' esistente: ${cityExists ? 'SÌ ❌' : 'NO ✅'}`);
    console.log(`Colonna 'region' esistente: ${regionExists ? 'SÌ ❌' : 'NO ✅'}`);
    
    // Ottieni le prime 3 aziende con la loro struttura
    const companiesQuery = `
      SELECT id, name, full_address, address, country
      FROM companies
      LIMIT 3;
    `;
    
    const companiesResult = await pool.query(companiesQuery);
    console.log('\nEsempio di dati azienda (primi 3 record):');
    companiesResult.rows.forEach(company => {
      console.log(`\nID: ${company.id}, Nome: ${company.name}`);
      console.log(`  - full_address: ${company.full_address || '(null)'}`);
      console.log(`  - address: ${company.address || '(null)'}`);
      console.log(`  - country: ${company.country || '(null)'}`);
    });
    
    console.log('\nVerifica completata.');
  } catch (error) {
    console.error('Errore durante la verifica:', error);
  } finally {
    // Chiudi la connessione
    await pool.end();
  }
}

main();