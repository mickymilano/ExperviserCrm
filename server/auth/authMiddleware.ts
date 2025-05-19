/**
 * Middleware di autenticazione sicuro e indipendente dal database
 */
import { Request, Response, NextFunction } from 'express';
import { authenticateSecure, TokenPayload } from './secureAuth';

// Estende l'interfaccia di Request per includere l'utente autenticato
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware per verificare e decodificare il token JWT
 * Supporta modalità di sviluppo senza dipendenza dal database
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Ottieni il token dai cookie o dall'header Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  // Verifica il token (o genera utente di sviluppo in DEV_MODE)
  const user = authenticateSecure(token);
  
  if (!user) {
    console.log('[AUTH] Autenticazione fallita: token non valido o assente');
    return res.status(401).json({ 
      success: false, 
      message: 'Accesso negato. Effettua il login.'
    });
  }
  
  // Salva l'utente nella richiesta per l'uso nei controller
  req.user = user;
  next();
}

/**
 * Middleware per verificare i ruoli admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso negato. Richiesti privilegi di amministratore.' 
    });
  }
  next();
}

/**
 * Middleware per verificare il ruolo super admin
 */
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso negato. Richiesti privilegi di super amministratore.' 
    });
  }
  next();
}