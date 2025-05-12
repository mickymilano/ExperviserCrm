/**
 * Script per esportare i dati dal database in un formato JSON riutilizzabile
 * Questo può essere usato per clonare il progetto con dati puliti
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

import {
  users, contacts, companies, deals, 
  areasOfActivity, leads, pipelineStages, 
  tasks, activities
} from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function exportDatabase() {
  try {
    console.log('Avvio esportazione del database...');
    
    // Crea una directory per le esportazioni se non esiste
    const exportDir = path.join(process.cwd(), 'database-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    // Esporta tutte le tabelle principali
    const userData = await db.select().from(users);
    fs.writeFileSync(path.join(exportDir, 'users.json'), JSON.stringify(userData, null, 2));
    console.log(`Esportati ${userData.length} utenti`);
    
    const contactsData = await db.select().from(contacts);
    fs.writeFileSync(path.join(exportDir, 'contacts.json'), JSON.stringify(contactsData, null, 2));
    console.log(`Esportati ${contactsData.length} contatti`);
    
    const companiesData = await db.select().from(companies);
    fs.writeFileSync(path.join(exportDir, 'companies.json'), JSON.stringify(companiesData, null, 2));
    console.log(`Esportate ${companiesData.length} aziende`);
    
    const areasData = await db.select().from(areasOfActivity);
    fs.writeFileSync(path.join(exportDir, 'areas_of_activity.json'), JSON.stringify(areasData, null, 2));
    console.log(`Esportate ${areasData.length} aree di attività`);
    
    const leadsData = await db.select().from(leads);
    fs.writeFileSync(path.join(exportDir, 'leads.json'), JSON.stringify(leadsData, null, 2));
    console.log(`Esportati ${leadsData.length} lead`);
    
    const stagesData = await db.select().from(pipelineStages);
    fs.writeFileSync(path.join(exportDir, 'pipeline_stages.json'), JSON.stringify(stagesData, null, 2));
    console.log(`Esportati ${stagesData.length} stage di pipeline`);
    
    const dealsData = await db.select().from(deals);
    fs.writeFileSync(path.join(exportDir, 'deals.json'), JSON.stringify(dealsData, null, 2));
    console.log(`Esportati ${dealsData.length} deal`);
    
    const tasksData = await db.select().from(tasks);
    fs.writeFileSync(path.join(exportDir, 'tasks.json'), JSON.stringify(tasksData, null, 2));
    console.log(`Esportati ${tasksData.length} task`);
    
    const activitiesData = await db.select().from(activities);
    fs.writeFileSync(path.join(exportDir, 'activities.json'), JSON.stringify(activitiesData, null, 2));
    console.log(`Esportate ${activitiesData.length} attività`);
    
    // Crea un file indice con tutti i dati
    const allData = {
      users: userData,
      contacts: contactsData,
      companies: companiesData,
      areasOfActivity: areasData,
      leads: leadsData,
      pipelineStages: stagesData,
      deals: dealsData,
      tasks: tasksData,
      activities: activitiesData,
      exportDate: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(exportDir, 'all-data.json'), JSON.stringify(allData, null, 2));
    
    // Crea uno script di importazione
    const importScript = `
/**
 * Script per importare i dati esportati nel nuovo database
 * Esegui questo script dopo aver creato le tabelle nel nuovo database
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

import {
  users, contacts, companies, deals, 
  areasOfActivity, leads, pipelineStages, 
  tasks, activities, synergies
} from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Percorso dei file esportati
const dataDir = path.join(process.cwd(), 'database-export');

async function importData() {
  try {
    console.log('Avvio importazione dati...');
    
    // Controlla se la directory di esportazione esiste
    if (!fs.existsSync(dataDir)) {
      console.error('Directory di esportazione non trovata!');
      return;
    }
    
    // Importa le fasi della pipeline (necessarie per i deal)
    const stagesFile = path.join(dataDir, 'pipeline_stages.json');
    if (fs.existsSync(stagesFile)) {
      const stagesData = JSON.parse(fs.readFileSync(stagesFile, 'utf8'));
      if (stagesData.length > 0) {
        await db.insert(pipelineStages).values(stagesData);
        console.log(\`Importate \${stagesData.length} fasi di pipeline\`);
      }
    }
    
    // Importa gli utenti
    const usersFile = path.join(dataDir, 'users.json');
    if (fs.existsSync(usersFile)) {
      const userData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      if (userData.length > 0) {
        await db.insert(users).values(userData);
        console.log(\`Importati \${userData.length} utenti\`);
      }
    }
    
    // Importa i contatti
    const contactsFile = path.join(dataDir, 'contacts.json');
    if (fs.existsSync(contactsFile)) {
      const contactsData = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
      if (contactsData.length > 0) {
        await db.insert(contacts).values(contactsData);
        console.log(\`Importati \${contactsData.length} contatti\`);
      }
    }
    
    // Importa le aziende
    const companiesFile = path.join(dataDir, 'companies.json');
    if (fs.existsSync(companiesFile)) {
      const companiesData = JSON.parse(fs.readFileSync(companiesFile, 'utf8'));
      if (companiesData.length > 0) {
        await db.insert(companies).values(companiesData);
        console.log(\`Importate \${companiesData.length} aziende\`);
      }
    }
    
    // Importa le aree di attività
    const areasFile = path.join(dataDir, 'areas_of_activity.json');
    if (fs.existsSync(areasFile)) {
      const areasData = JSON.parse(fs.readFileSync(areasFile, 'utf8'));
      if (areasData.length > 0) {
        await db.insert(areasOfActivity).values(areasData);
        console.log(\`Importate \${areasData.length} aree di attività\`);
      }
    }
    
    // Importa i lead
    const leadsFile = path.join(dataDir, 'leads.json');
    if (fs.existsSync(leadsFile)) {
      const leadsData = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      if (leadsData.length > 0) {
        await db.insert(leads).values(leadsData);
        console.log(\`Importati \${leadsData.length} lead\`);
      }
    }
    
    // Importa i deal
    const dealsFile = path.join(dataDir, 'deals.json');
    if (fs.existsSync(dealsFile)) {
      const dealsData = JSON.parse(fs.readFileSync(dealsFile, 'utf8'));
      if (dealsData.length > 0) {
        await db.insert(deals).values(dealsData);
        console.log(\`Importati \${dealsData.length} deal\`);
      }
    }
    
    // Importa i task
    const tasksFile = path.join(dataDir, 'tasks.json');
    if (fs.existsSync(tasksFile)) {
      const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (tasksData.length > 0) {
        await db.insert(tasks).values(tasksData);
        console.log(\`Importati \${tasksData.length} task\`);
      }
    }
    
    // Importa le attività
    const activitiesFile = path.join(dataDir, 'activities.json');
    if (fs.existsSync(activitiesFile)) {
      const activitiesData = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
      if (activitiesData.length > 0) {
        await db.insert(activities).values(activitiesData);
        console.log(\`Importate \${activitiesData.length} attività\`);
      }
    }
    
    console.log('Importazione completata con successo!');
  } catch (error) {
    console.error('Errore durante l\'importazione dei dati:', error);
  } finally {
    await pool.end();
  }
}

// Esegui lo script
importData();
    `;
    
    fs.writeFileSync(path.join(exportDir, 'import-data.ts'), importScript);
    
    console.log('\nEsportazione completata con successo!');
    console.log(`I dati sono stati salvati nella directory: ${exportDir}`);
    console.log('Per importare i dati nel nuovo progetto, copia la directory "database-export" e utilizza lo script import-data.ts');
    
  } catch (error) {
    console.error('Errore durante l\'esportazione del database:', error);
  } finally {
    await pool.end();
  }
}

// Esegui lo script
exportDatabase();