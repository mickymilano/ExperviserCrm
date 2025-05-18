// Script di test per la creazione di un contatto con area attività
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

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
  try {
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
  } catch (e) {
    console.error("Errore nel recupero aree:", e);
  }
  
  console.log("\n3. Verifica contatti dell'azienda...");
  try {
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
  } catch (e) {
    console.error("Errore nel recupero contatti azienda:", e);
  }
  
  console.log("\n4. Verifica diretta nel DB...");
  try {
    // Esegui una query SQL diretta per verificare le aree di attività
    const sqlRes = await fetch('http://localhost:5000/api/debug/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `SELECT * FROM areas_of_activity WHERE contact_id = ${contact.id}`
      })
    });
    
    if (!sqlRes.ok) {
      console.error(`Errore SQL: ${sqlRes.status}`);
    } else {
      const sqlData = await sqlRes.json();
      console.log("Query SQL result:", sqlData);
    }
  } catch (e) {
    console.error("Errore nell'esecuzione query:", e);
  }
}

main().catch(e => console.error(e));
