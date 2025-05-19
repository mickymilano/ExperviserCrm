/**
 * Controller per la gestione dell'autenticazione
 * Supporta modalità di fallback quando il database non è disponibile
 */
import { Request, Response } from 'express';
import { storage } from '../storage';
import { isFallbackMode } from '../db';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateEmergencyPayload,
  TokenPayload 
} from './secureAuth';

/**
 * Crea una risposta di autenticazione con token e dati utente
 * @param payload Dati utente da includere nel token
 * @returns Oggetto con token e dati utente
 */
// Helper per creare una risposta di autenticazione coerente
function createAuthResponse(payload: TokenPayload) {
  const token = generateToken(payload);
  
  // Rimuovi la password e altri dati sensibili
  const { password, ...userWithoutPassword } = payload as any;
  
  return {
    success: true,
    token,
    user: userWithoutPassword
  };
}

/**
 * Controller per il login utente
 * @param req Request con email e password
 * @param res Response
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password, bypassAuth } = req.body;
    
    // Validazione input
    if (!email || (!password && !bypassAuth)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e password sono richiesti' 
      });
    }
    
    // Bypass autenticazione in sviluppo (se abilitato)
    if (process.env.NODE_ENV === 'development' && bypassAuth) {
      const devPayload: TokenPayload = {
        id: 0,
        email: email || 'dev@experviser.test',
        username: 'dev_user',
        role: 'admin'
      };
      
      return res.json(createAuthResponse(devPayload));
    }
    
    // In modalità fallback, crea un token di emergenza
    if (isFallbackMode()) {
      console.log('Login in modalità fallback per:', email);
      
      // Supporta credenziali specifiche (utente michele)
      if ((email === 'michele' || email === 'michele@experviser.com') && password === 'admin_admin_69') {
        console.log('Accesso con credenziali admin predefinite');
        const adminPayload: TokenPayload = {
          id: 1,
          email: 'michele@experviser.com',
          username: 'michele',
          role: 'super_admin'
        };
        return res.json(createAuthResponse(adminPayload));
      }
      
      // Fallback generico per altri utenti
      const emergencyPayload = generateEmergencyPayload(email);
      return res.json(createAuthResponse(emergencyPayload));
    }
    
    // Verifica credenziali nel database
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }
    
    // Verifica password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }
    
    // Aggiorna ultimo accesso
    await storage.updateUser(user.id, { lastLogin: new Date() });
    
    // Crea token e risposta
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    
    res.json(createAuthResponse(payload));
  } catch (error: any) {
    console.error('Errore login:', error);
    
    // Se c'è un errore di database, usa la modalità fallback
    if (error.message?.includes('database') || error.message?.includes('connection')) {
      const email = req.body.email || 'unknown@emergency.com';
      console.log('Login fallback per errore database:', email);
      const emergencyPayload = generateEmergencyPayload(email);
      return res.json(createAuthResponse(emergencyPayload));
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante il login' 
    });
  }
}

/**
 * Controller per la registrazione
 * @param req Request con dati utente
 * @param res Response
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, username, fullName } = req.body;
    
    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e password sono richiesti' 
      });
    }
    
    // In modalità fallback, restituisci un errore
    if (isFallbackMode()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Registrazione disabilitata in modalità fallback. Riprova più tardi.' 
      });
    }
    
    // Verifica se utente esiste già
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email già registrata' 
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Crea utente
    const newUser = await storage.createUser({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      fullName: fullName || username || email.split('@')[0],
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Crea token e risposta
    const payload: TokenPayload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role
    };
    
    res.status(201).json(createAuthResponse(payload));
  } catch (error: any) {
    console.error('Errore registrazione:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la registrazione' 
    });
  }
}

/**
 * Controller per il logout
 * @param req Request
 * @param res Response
 */
export function logout(req: Request, res: Response) {
  // Elimina il cookie (se utilizzato)
  res.clearCookie('token');
  
  res.json({ 
    success: true, 
    message: 'Logout effettuato con successo' 
  });
}

/**
 * Controller per verificare il token e ottenere dati utente
 * @param req Request (con user impostato dal middleware)
 * @param res Response
 */
export async function verifyAuth(req: Request, res: Response) {
  try {
    // L'utente è stato già verificato dal middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorizzato' 
      });
    }
    
    // In modalità fallback, restituisci i dati del token
    if (isFallbackMode() || req.user.id === 'emergency') {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          role: req.user.role,
          fallbackMode: true
        }
      });
    }
    
    // Altrimenti, ottieni i dati dal database
    const user = await storage.getUser(Number(req.user.id));
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }
    
    // Rimuovi la password dalla risposta
    const { password, ...userWithoutPassword } = user as any;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Errore verifica auth:', error);
    
    // Se c'è un errore di database, usa i dati dal token
    if (error.message?.includes('database') || error.message?.includes('connection')) {
      return res.json({
        success: true,
        user: {
          id: req.user?.id,
          email: req.user?.email,
          username: req.user?.username,
          role: req.user?.role,
          fallbackMode: true
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la verifica dell\'autenticazione' 
    });
  }
}

/**
 * Genera un token di accesso di emergenza (solo per sviluppo/test)
 * @param req Request
 * @param res Response
 */
export function generateEmergencyAccess(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email richiesta' 
      });
    }
    
    const emergencyPayload = generateEmergencyPayload(email);
    res.json(createAuthResponse(emergencyPayload));
  } catch (error) {
    console.error('Errore generazione accesso emergenza:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la generazione del token di emergenza' 
    });
  }
}