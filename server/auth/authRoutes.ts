/**
 * Rotte per l'autenticazione
 * Con supporto per funzionamento in modalità fallback
 */
import { Router } from 'express';
import { login, logout, register, verifyAuth, generateEmergencyAccess } from './authController';
import { authenticate } from './authMiddleware';
import { setFallbackMode, isFallbackMode } from '../db';
import jwt from 'jsonwebtoken';

const authRouter = Router();

// Rotta per il login
authRouter.post('/login', login);

// Rotta per la registrazione
authRouter.post('/register', register);

// Rotta per il logout
authRouter.post('/logout', logout);

// Rotta per verificare l'autenticazione e ottenere i dati utente
authRouter.get('/me', authenticate, verifyAuth);

// Endpoint per login diretto di emergenza (michele/admin_admin_69)
authRouter.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  
  if ((username === 'michele' || username === 'michele@experviser.com') && password === 'admin_admin_69') {
    // Forza l'attivazione della modalità fallback
    setFallbackMode(true);
    
    // Payload amministratore
    const adminPayload = {
      id: 1,
      email: 'michele@experviser.com',
      username: 'michele',
      role: 'super_admin'
    };
    
    // Genera token
    const token = jwt.sign(adminPayload, process.env.JWT_SECRET || 'experviser_dev_secret', {
      expiresIn: '24h'
    });
    
    // Restituisci risposta
    return res.json({
      success: true,
      token,
      user: {
        ...adminPayload,
        fullName: 'Michele Experviser'
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Credenziali di emergenza non valide'
  });
});

// Endpoint per verificare lo stato della modalità fallback
authRouter.get('/system-status', (req, res) => {
  res.json({
    fallbackMode: isFallbackMode(),
    databaseConnected: !isFallbackMode()
  });
});

// Rotta per ottenere un token di emergenza (solo sviluppo)
if (process.env.NODE_ENV === 'development') {
  authRouter.post('/emergency-access', generateEmergencyAccess);
}

export default authRouter;