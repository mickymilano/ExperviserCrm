/**
 * Routes per l'autenticazione sicura
 */
import express from 'express';
import { login, logout, getMe, generateEmergencyToken } from './authController';
import { authenticate } from './authMiddleware';

// Crea un router dedicato per l'autenticazione
const authRouter = express.Router();

// Definisci le rotte di autenticazione
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);

// Rotta per generare token di emergenza (solo per sviluppo)
if (process.env.NODE_ENV === 'development') {
  authRouter.get('/emergency-token', generateEmergencyToken);
}

export default authRouter;