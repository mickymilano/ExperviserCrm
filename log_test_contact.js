// Script di test per la creazione di un contatto con area attività
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function main() {
  // Genera token
  const token = jwt.sign(
    { id: 1, username: 'debug', role: 'super_admin' },
    'experviser-dev-secret',
    { expiresIn: '1h' }
  );
  
  console.log("1. Creo un contatto con companyId...");
  const contactName = `TestDebug_${Date.now()}`;
  
  const contactRes = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: contactName,
      lastName: "Debug",
      companyEmail: `${contactName.toLowerCase()}@example.com`,
      companyId: 19, // EasyPoke
    })
  });
  
  const contact = await contactRes.json();
  console.log("Contatto creato:", contact);
  
  console.log("\n2. Verifica aree di attività per questo contatto...");
  const areasRes = await fetch(`http://localhost:5000/api/areas-of-activity?contactId=${contact.id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!areasRes.ok) {
    console.error(`Errore ${areasRes.status}: ${await areasRes.text()}`);
  } else {
    const areas = await areasRes.json();
    console.log("Aree di attività trovate:", areas);
  }
  
  console.log("\n3. Verifica contatti dell'azienda...");
  const companyContactsRes = await fetch('http://localhost:5000/api/companies/19/contacts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!companyContactsRes.ok) {
    console.error(`Errore ${companyContactsRes.status}: ${await companyContactsRes.text()}`);
  } else {
    const companyContacts = await companyContactsRes.json();
    console.log("Contatti dell'azienda:", companyContacts);
    
    const found = companyContacts.some(c => c.id === contact.id);
    console.log(`Il contatto ${contact.id} è nell'elenco dell'azienda: ${found}`);
  }
  
  console.log("\n4. Query diretta al DB per verificare aree attività...");
  const dbRes = await fetch('http://localhost:5000/api/debug/areas', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contactId: contact.id })
  });
  
  if (!dbRes.ok) {
    console.error(`Errore API debug: ${dbRes.status}`);
  } else {
    const dbData = await dbRes.json();
    console.log("DB check result:", dbData);
  }
}

main().catch(e => console.error(e));
