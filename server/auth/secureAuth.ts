/**
 * Sistema di autenticazione sicuro e robusto per Experviser CRM
 * Implementa autenticazione JWT con crittografia avanzata e resilienza agli errori di database
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../shared/schema';

// Configurazione
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';
const TOKEN_EXPIRY = '30d'; // Durata token: 30 giorni
const REFRESH_TOKEN_EXPIRY = '90d'; // Durata refresh token: 90 giorni
const DEV_MODE = process.env.NODE_ENV === 'development';

// Interfacce
export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: Partial<User>;
}

/**
 * Genera un token JWT sicuro
 * @param payload Dati da includere nel token
 * @param expiry Durata di validità del token
 * @returns Token JWT firmato
 */
export function generateToken(payload: TokenPayload, expiry = TOKEN_EXPIRY): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry });
}

/**
 * Verifica e decodifica un token JWT
 * @param token Token JWT da verificare
 * @returns Dati decodificati o null in caso di errore
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Errore verifica token:', error);
    return null;
  }
}

/**
 * Crea un utente di sviluppo predefinito per i test
 * @returns Utente di sviluppo con privilegi di amministratore
 */
export function createDevUser(): Partial<User> {
  return {
    id: 1,
    username: 'admin',
    email: 'admin@experviser.com',
    fullName: 'Amministratore',
    role: 'super_admin',
    status: 'active',
    language: 'it',
    timezone: 'Europe/Rome',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    emailVerified: true
  };
}

/**
 * Verifica l'accesso con bypass per ambiente di sviluppo
 * @param token Token JWT da verificare
 * @returns Payload decodificato o utente di sviluppo
 */
export function authenticateSecure(token?: string): TokenPayload | null {
  // In modalità sviluppo, fornisci sempre un utente di test
  if (DEV_MODE) {
    console.log('[AUTH] Utilizzando autenticazione di sviluppo');
    const devUser = createDevUser();
    return {
      id: devUser.id!,
      username: devUser.username!,
      email: devUser.email!,
      role: devUser.role!
    };
  }

  // In produzione, verifica il token
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Genera un hash sicuro della password
 * @param password Password in chiaro
 * @returns Hash della password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica una password confrontandola con l'hash
 * @param password Password in chiaro
 * @param hash Hash della password
 * @returns true se la password è corretta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Genera un token di accesso per l'utente
 * @param user Dati utente
 * @returns Risposta di autenticazione
 */
export function createAuthResponse(user: Partial<User>): AuthResponse {
  if (!user || !user.id || !user.username || !user.email || !user.role) {
    return {
      success: false,
      message: 'Dati utente incompleti'
    };
  }

  const tokenPayload: TokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  // Genera token di accesso e refresh token
  const token = generateToken(tokenPayload);
  const refreshToken = generateToken(tokenPayload, REFRESH_TOKEN_EXPIRY);

  // Rimuovi campi sensibili dai dati utente
  const safeUser = { ...user };
  delete safeUser.password;

  return {
    success: true,
    message: 'Autenticazione completata con successo',
    token,
    refreshToken,
    user: safeUser
  };
}