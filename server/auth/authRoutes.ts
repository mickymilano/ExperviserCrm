/**
 * Rotte per l'autenticazione
 * Con supporto per funzionamento in modalità fallback
 */
import { Router } from 'express';
import { login, logout, register, verifyAuth, generateEmergencyAccess } from './authController';
import { authenticate } from './authMiddleware';

const authRouter = Router();

// Rotta per il login
authRouter.post('/login', login);

// Rotta per la registrazione
authRouter.post('/register', register);

// Rotta per il logout
authRouter.post('/logout', logout);

// Rotta per verificare l'autenticazione e ottenere i dati utente
authRouter.get('/me', authenticate, verifyAuth);

// Rotta per ottenere un token di emergenza (solo sviluppo)
if (process.env.NODE_ENV === 'development') {
  authRouter.post('/emergency-access', generateEmergencyAccess);
}

export default authRouter;