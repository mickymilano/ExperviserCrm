/**
 * Script per generare un token di autenticazione di test
 * Utile per accedere al CRM anche quando il database non è disponibile
 */
import jwt from 'jsonwebtoken';

// Chiave segreta per JWT (deve corrispondere a quella in secureAuth.ts)
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-secure-auth-secret-key';

// Crea un utente di test predefinito
const testUser = {
  id: 1,
  username: 'admin',
  email: 'admin@experviser.com',
  role: 'super_admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 giorni
};

// Genera il token
const token = jwt.sign(testUser, JWT_SECRET);

console.log('-------------------------------------');
console.log('TOKEN DI AUTENTICAZIONE DI EMERGENZA');
console.log('-------------------------------------');
console.log();
console.log('Token generato (valido per 30 giorni):');
console.log(token);
console.log();
console.log('Istruzioni per l\'uso:');
console.log('1. Apri la console del browser con F12');
console.log('2. Copia e incolla il comando seguente:');
console.log(`localStorage.setItem('auth_token', '${token}');`);
console.log('3. Ricarica la pagina del CRM');
console.log();
console.log('IMPORTANTE: Questo token funziona anche con database non disponibile');