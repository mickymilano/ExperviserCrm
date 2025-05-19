// Questo script genera un token di autenticazione JWT che può essere usato
// per accedere al CRM quando ci sono problemi di database
// Usa: node create_auth_token.js

// In Node.js, usa require in CommonJS
// Per eseguire questo file, salva con estensione .cjs o usa node --commonjs
const jwt = require('jsonwebtoken');

// La stessa chiave segreta usata nel server
const JWT_SECRET = 'experviser-dev-secret';

// Crea un token per un utente admin
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
console.log('1. Vai alla console del browser nel tuo CRM (F12 > Console)');
console.log('2. Incolla ed esegui questo comando:');
console.log(`localStorage.setItem('auth_token', '${token}');`);
console.log('3. Ricarica la pagina per accedere automaticamente.\n');