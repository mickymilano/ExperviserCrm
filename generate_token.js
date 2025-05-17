// Script per generare un token JWT valido
import jwt from 'jsonwebtoken';

// Usa il segreto di default definito nel server
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';

// Crea un payload per un utente amministratore
const payload = {
  id: 1,
  username: 'debug',
  role: 'super_admin'
};

// Genera il token con scadenza di 24 ore
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

// Stampa il token
console.log(token);