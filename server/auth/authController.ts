/**
 * Controller per la gestione delle operazioni di autenticazione
 * Versione con meccanismo di bypass per sviluppo
 */
import { Request, Response } from 'express';
import { verifyPassword, generateToken, createAuthResponse, createDevUser, TokenPayload } from './secureAuth';
import { storage } from '../storage';

/**
 * Gestisce il login utente
 * In modalità sviluppo: fornisce sempre l'utente admin predefinito
 * In produzione: verifica le credenziali contro il database
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // Validazione input base
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password sono richiesti'
      });
    }
    
    // In modalità sviluppo, bypass della verifica credenziali
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Login in modalità sviluppo');
      
      // Crea una risposta di autenticazione con l'utente di sviluppo
      const devUser = createDevUser();
      const authResponse = createAuthResponse(devUser);
      
      // Imposta il cookie di autenticazione
      if (authResponse.token) {
        res.cookie('token', authResponse.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 giorni
        });
      }
      
      return res.json(authResponse);
    }
    
    // In produzione, verifica le credenziali nel database
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    // Verifica la password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    // Genera la risposta di autenticazione
    const authResponse = createAuthResponse(user);
    
    // Imposta il cookie di autenticazione
    if (authResponse.token) {
      res.cookie('token', authResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 giorni
      });
    }
    
    return res.json(authResponse);
  } catch (error) {
    console.error('Errore durante il login:', error);
    
    // In caso di errore in sviluppo, genera comunque l'autenticazione
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Generando autenticazione di fallback');
      
      // Crea una risposta di autenticazione con l'utente di sviluppo
      const devUser = createDevUser();
      const authResponse = createAuthResponse(devUser);
      
      // Imposta il cookie di autenticazione
      if (authResponse.token) {
        res.cookie('token', authResponse.token, {
          httpOnly: true,
          secure: false,
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 giorni
        });
      }
      
      return res.json(authResponse);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Errore durante il login'
    });
  }
}

/**
 * Gestisce il logout utente
 * Elimina il cookie di autenticazione
 */
export function logout(req: Request, res: Response) {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logout completato con successo'
  });
}

/**
 * Fornisce informazioni sull'utente corrente
 * In modalità sviluppo: fornisce sempre l'utente admin predefinito
 * In produzione: recupera i dati utente dal database
 */
export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }
    
    // In modalità sviluppo, restituisci l'utente predefinito completo
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Restituendo utente di sviluppo');
      
      const devUser = createDevUser();
      
      return res.json({
        success: true,
        user: devUser
      });
    }
    
    // In produzione, recupera i dati utente dal database
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    // Rimuovi dati sensibili
    const safeUser = { ...user };
    delete safeUser.password;
    
    return res.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Errore nel recupero dei dati utente:', error);
    
    // In caso di errore in sviluppo, restituisci comunque l'utente predefinito
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Restituendo utente di sviluppo di fallback');
      
      const devUser = createDevUser();
      
      return res.json({
        success: true,
        user: devUser
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei dati utente'
    });
  }
}

/**
 * Genera un token di emergenza (solo per sviluppo)
 */
export function generateEmergencyToken(req: Request, res: Response) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'Questa funzione è disponibile solo in modalità sviluppo'
    });
  }
  
  try {
    // Crea l'utente di sviluppo
    const devUser = createDevUser();
    
    // Crea il payload del token
    const payload: TokenPayload = {
      id: devUser.id!,
      username: devUser.username!,
      email: devUser.email!,
      role: devUser.role!
    };
    
    // Genera il token con durata estesa (90 giorni)
    const token = generateToken(payload, '90d');
    
    return res.json({
      success: true,
      message: 'Token di emergenza generato con successo',
      token,
      instructions: 'Salva questo token in localStorage con: localStorage.setItem("auth_token", token)'
    });
  } catch (error) {
    console.error('Errore nella generazione del token di emergenza:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore nella generazione del token di emergenza'
    });
  }
}