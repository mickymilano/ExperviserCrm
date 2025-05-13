/**
 * Script per aggiungere l'utente amministratore Michele
 */

// Import delle dipendenze
const { storage } = require('./storage');

async function addAdmin() {
  try {
    // Verifica se l'utente esiste già
    const existingUser = await storage.getUserByUsername('michele');
    
    if (existingUser) {
      console.log('L\'utente michele@experviser.com esiste già nel sistema');
      return;
    }
    
    // Aggiungi il nuovo utente amministratore
    const adminUser = {
      username: 'michele',
      password: '$2b$10$xP/0vn6gaY5DmxjgfOp.WejfD4WuO1h80RUMQqHwPPRoKqc1dpmcK', // admin_admin_69
      email: 'michele@experviser.com',
      fullName: 'Michele Amministratore',
      role: 'super_admin',
      status: 'active',
      avatar: null,
      backupEmail: null,
      emailVerified: true,
      preferences: null,
    };
    
    const newUser = await storage.createUser(adminUser);
    console.log(`Utente amministratore creato con ID: ${newUser.id}`);
    
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente amministratore:', error);
  }
}

// Esegui la funzione
addAdmin();