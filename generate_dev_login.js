import jwt from 'jsonwebtoken';
import fs from 'fs';

// Chiave segreta JWT (stessa usata nel server)
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';

// Crea un utente fittizio per lo sviluppo
const debugUser = {
  id: 1,
  username: 'admin',
  email: 'admin@experviser.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
};

// Genera il token JWT
const token = jwt.sign(
  debugUser,
  JWT_SECRET,
  { expiresIn: '7d' } // 7 giorni
);

console.log('\n=== TOKEN JWT PER AUTENTICAZIONE DI SVILUPPO ===');
console.log(token);
console.log('\n=== ISTRUZIONI ===');
console.log('Per utilizzare questo token e accedere al CRM:');
console.log('1. Vai alla console del browser nel tuo CRM (F12 > Console)');
console.log('2. Incolla ed esegui questo comando:');
console.log(`localStorage.setItem('auth_token', '${token}');\n`);
console.log('3. Ricarica la pagina per accedere automaticamente.\n');

// Genera anche istruzioni in un file
fs.writeFileSync('login_instructions.txt', 
`TOKEN JWT PER AUTENTICAZIONE DI SVILUPPO
${token}

ISTRUZIONI
Per utilizzare questo token e accedere al CRM:
1. Vai alla console del browser nel tuo CRM (F12 > Console)
2. Incolla ed esegui questo comando:
localStorage.setItem('auth_token', '${token}');
3. Ricarica la pagina per accedere automaticamente.
`);

console.log('Istruzioni salvate anche in login_instructions.txt');