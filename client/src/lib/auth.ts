/**
 * Utility per l'autenticazione lato client
 */

/**
 * Effettua il login con email e password
 * @param email Email dell'utente
 * @param password Password dell'utente
 * @param bypassAuth Flag per attivare il bypass in sviluppo (se abilitato lato server)
 * @returns Risposta del server con token e dati utente
 */
export async function login(email: string, password: string, bypassAuth = false) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, bypassAuth }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Errore durante il login');
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Salva il token nei cookie per le successive richieste
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    return data;
  } catch (error) {
    console.error('Errore login:', error);
    throw error;
  }
}

/**
 * Effettua il logout
 */
export async function logout() {
  try {
    const response = await fetch('/api/auth/logout');
    
    // Rimuovi il token dai cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    return await response.json();
  } catch (error) {
    console.error('Errore logout:', error);
    throw error;
  }
}

/**
 * Recupera le informazioni dell'utente corrente
 * @returns Dati dell'utente o null se non autenticato
 */
export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me');
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Errore recupero utente:', error);
    return null;
  }
}

/**
 * Genera un token di emergenza (solo per sviluppo)
 */
export async function generateEmergencyToken() {
  try {
    const response = await fetch('/api/auth/emergency-token', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Errore generazione token di emergenza');
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Salva il token nei cookie per le successive richieste
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    return data;
  } catch (error) {
    console.error('Errore generazione token:', error);
    throw error;
  }
}