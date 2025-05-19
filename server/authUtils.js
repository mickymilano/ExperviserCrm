/**
 * Utility per autenticazione sicura anche in caso di problemi di database
 */
import jwt from 'jsonwebtoken';

// Chiave segreta per JWT (ripresa da routes.ts)
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';

/**
 * Crea un token JWT per autenticazione di sviluppo
 * @param {Object} userData - Dati utente da incorporare nel token
 * @returns {string} Token JWT
 */
export function createDevelopmentToken(userData = {}) {
  // Crea un utente di sviluppo completo
  const userDefaults = {
    id: 1,
    username: 'admin',
    email: 'admin@experviser.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'super_admin',
    isActive: true
  };

  // Unisci i dati forniti con i valori predefiniti
  const finalUserData = { ...userDefaults, ...userData };

  // Genera il token con scadenza di 30 giorni
  return jwt.sign(
    finalUserData,
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verifica se siamo in ambiente di sviluppo
 * @returns {boolean}
 */
export function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Crea l'oggetto utente di sviluppo per il bypass dell'autenticazione
 * @returns {Object} Utente di sviluppo
 */
export function createDevelopmentUser() {
  return {
    id: 1,
    username: 'admin',
    email: 'admin@experviser.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date()
  };
}

/**
 * Verificatore del token JWT più robusto, con fallback per sviluppo
 * @param {string} token - Token JWT da verificare
 * @returns {Object|null} Dati utente decodificati o null
 */
export function verifyTokenWithFallback(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Errore nella verifica del token JWT:', error);
    
    // In sviluppo, fornisci un utente di fallback
    if (isDevelopmentMode()) {
      console.warn('ATTENZIONE: In modalità sviluppo, fornendo utente di fallback');
      return createDevelopmentUser();
    }
    
    return null;
  }
}