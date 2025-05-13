// Script di navigazione semplice per testare che tutte le pagine principali dell'applicazione siano accessibili
// Questo script non richiede Playwright ma usa il browser API come puppeteer per il testing

const { exec } = require('child_process');
const puppeteer = require('puppeteer');

// Ottiene i moduli da testare dagli argomenti della command line
const args = process.argv.slice(2);
const modulesArg = args.find(arg => arg.startsWith('--modules='));
const MODULES = modulesArg 
  ? modulesArg.replace('--modules=', '').split(',') 
  : ['contacts', 'companies', 'deals', 'leads', 'synergies', 'calendar', 'email'];
const BASE_URL = 'http://localhost:5000';

async function testModuleNavigation() {
  console.log('Avvio test di navigazione...');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Test home page
  try {
    await page.goto(BASE_URL);
    console.log('✅ Home page OK');
  } catch (error) {
    console.error('❌ Errore nella home page:', error.message);
  }
  
  // Test navigazione moduli
  for (const moduleName of MODULES) {
    console.log(`\nTest modulo: ${moduleName}`);
    
    try {
      // Vai alla pagina del modulo
      await page.goto(`${BASE_URL}/${moduleName}`);
      await page.waitForTimeout(1000);
      console.log(`✅ Pagina ${moduleName} OK`);
      
      // Cerca il primo elemento nella lista con un link
      const links = await page.$$(`a[href^="/${moduleName}/"]`);
      
      if (links.length > 0) {
        const href = await page.evaluate(el => el.getAttribute('href'), links[0]);
        const id = href.split('/').pop();
        
        console.log(`  Trovato elemento con ID: ${id}`);
        
        // Vai al dettaglio
        await links[0].click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        console.log(`  Navigato a: ${currentUrl}`);
        
        if (currentUrl.includes(`/${moduleName}/${id}`)) {
          console.log(`  ✅ Pagina dettaglio ${moduleName}/${id} OK`);
        } else {
          console.log(`  ❌ Errore navigazione a ${moduleName}/${id}`);
        }
        
        // Cerca pulsanti di azione
        const editButton = await page.$('button:has-text("Edit")');
        if (editButton) {
          console.log('  ✅ Pulsante Edit presente');
        }
        
        const deleteButton = await page.$('button:has-text("Delete")');
        if (deleteButton) {
          console.log('  ✅ Pulsante Delete presente');
        }
      } else {
        console.log(`  ⚠️ Nessun elemento trovato nella lista ${moduleName}`);
      }
    } catch (error) {
      console.error(`  ❌ Errore nel modulo ${moduleName}:`, error.message);
    }
  }
  
  await browser.close();
  console.log('\nTest di navigazione completato!');
}

// Esegui i test solo se il server è attivo
console.log('Verifica che il server sia attivo...');
exec('curl -s http://localhost:5000', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Il server non sembra essere attivo. Avvia prima il server con "npm run dev"');
    process.exit(1);
  }
  
  console.log('✅ Server attivo, avvio test...');
  testModuleNavigation().catch(console.error);
});