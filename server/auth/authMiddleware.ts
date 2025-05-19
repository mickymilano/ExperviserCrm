/**
 * Middleware per la gestione dell'autenticazione e autorizzazione
 * Con supporto per modalità di fallback quando il database non è disponibile
 */
import { Request, Response, NextFunction } from 'express';
import { extractTokenFromRequest, verifyToken, TokenPayload } from './secureAuth';
import { isFallbackMode } from '../db';

// Estende l'interfaccia Request per includere l'utente autenticato
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware per verificare se l'utente è autenticato
 * Imposta req.user se il token è valido
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Estrai il token dalla richiesta
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accesso non autorizzato' 
    });
  }

  // Verifica il token
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token non valido o scaduto' 
    });
  }

  // Imposta l'utente nella richiesta
  req.user = payload;
  next();
}

/**
 * Middleware per verificare se l'utente ha un ruolo specifico
 * @param roles Array di ruoli autorizzati
 */
export function authorize(roles: ('user' | 'admin' | 'super_admin')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica che l'utente sia autenticato
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accesso non autorizzato' 
      });
    }

    // Verifica il ruolo
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non hai i permessi necessari per accedere a questa risorsa' 
      });
    }

    next();
  };
}

/**
 * Middleware per le rotte che richiedono autenticazione ma possono funzionare in modalità fallback
 * Quando il database non è disponibile, consente l'accesso con token speciali
 */
export function authenticateFallback(req: Request, res: Response, next: NextFunction) {
  // Estrai il token dalla richiesta
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accesso non autorizzato' 
    });
  }

  // Verifica il token
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token non valido o scaduto' 
    });
  }

  // Se siamo in modalità fallback, accetta qualsiasi token valido
  // anche se l'utente non esiste nel database
  if (isFallbackMode()) {
    req.user = payload;
    return next();
  }

  // In modalità normale, controlla che l'utente esista nel database
  // Questa logica sarà implementata dal controller
  req.user = payload;
  next();
}

/**
 * Middleware per bypassare l'autenticazione in ambiente di sviluppo
 * Da usare SOLO per test
 */
export function devAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development' && req.body.bypassAuth) {
    // Crea un utente admin fittizio
    req.user = {
      id: 0,
      email: 'dev@experviser.test',
      role: 'admin'
    };
    return next();
  }
  
  // Altrimenti, usa l'autenticazione normale
  return authenticate(req, res, next);
}