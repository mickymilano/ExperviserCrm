// Questo script genera un token JWT per accedere al CRM anche con problemi di database
import jwt from 'jsonwebtoken';
import fs from 'fs';

// La stessa chiave segreta usata nel server
const JWT_SECRET = 'experviser-dev-secret';

// Crea un token per un utente amministratore
const token = jwt.sign(
  { 
    id: 1, 
    username: 'admin', 
    role: 'super_admin'
  }, 
  JWT_SECRET,
  { expiresIn: '30d' } // 30 giorni
);

console.log('\n=== TOKEN JWT PER AUTENTICAZIONE DI SVILUPPO ===');
console.log(token);
console.log('\n=== ISTRUZIONI ===');
console.log('Per utilizzare questo token e accedere al CRM:');
console.log('1. Apri la console del browser nel tuo CRM (F12 > Console)');
console.log('2. Incolla ed esegui questo comando:');
console.log(`localStorage.setItem('auth_token', '${token}');`);
console.log('3. Ricarica la pagina per accedere automaticamente.\n');