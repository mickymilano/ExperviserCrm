/**
 * Modulo per la gestione sicura dell'autenticazione
 * Supporta modalità di fallback in caso di problemi con il database
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request } from 'express';

// Durata del token (24 ore)
const TOKEN_EXPIRY = '24h';

// Chiave segreta per JWT (in produzione usare variabile d'ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-secure-auth-secret-key';

// Interfaccia per il payload del token
export interface TokenPayload {
  id: number | string;
  email: string;
  username?: string;
  role: 'user' | 'admin' | 'super_admin';
  exp?: number;
}

/**
 * Genera una password hash
 * @param password Password in chiaro
 * @returns Password hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica la password
 * @param password Password in chiaro
 * @param hashedPassword Password hash
 * @returns true se la password è corretta
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Genera un token JWT
 * @param payload Dati da includere nel token
 * @returns Token JWT
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifica un token JWT
 * @param token Token JWT
 * @returns Payload del token se valido, null altrimenti
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Estrae il token dalla richiesta
 * @param req Richiesta Express
 * @returns Token JWT o null
 */
export function extractTokenFromRequest(req: Request): string | null {
  // Controllo in header Authorization (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Controllo nei cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * Genera un token di amministratore per sviluppo
 * Da usare SOLO in ambiente di sviluppo
 */
export function generateDevToken(): string {
  const adminPayload: TokenPayload = {
    id: 0,
    email: 'admin@experviser.test',
    username: 'admin',
    role: 'admin'
  };
  
  return generateToken(adminPayload);
}

/**
 * Genera un payload di emergenza basato sulle informazioni dell'utente
 * Da usare quando il database non è disponibile
 */
export function generateEmergencyPayload(email: string): TokenPayload {
  return {
    id: 'emergency',
    email: email,
    username: email.split('@')[0],
    role: 'user'
  };
}