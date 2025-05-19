/**
 * Middleware di autenticazione centralizzato
 */
import jwt from 'jsonwebtoken';

/**
 * Middleware per l'autenticazione tramite JWT
 */
export const authenticateJWT = (req: any, res: any, next: any) => {
  // Token può essere nel cookie o nell'header Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  try {
    // Verifica del token con la chiave segreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token non valido o scaduto' });
  }
};

/**
 * Middleware per verificare se l'utente è amministratore
 */
export const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Accesso negato: richiesti privilegi di amministratore' });
  }
};

/**
 * Middleware per verificare se l'utente è super admin
 */
export const isSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Accesso negato: richiesti privilegi di super amministratore' });
  }
};