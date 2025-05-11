/**
 * Script per forzare il reindirizzamento alla pagina di login
 * Eseguire questo script nella console del browser per:
 * 1. Eliminare il token di autenticazione esistente
 * 2. Forzare un reindirizzamento alla pagina di login
 */

// Elimina il token salvato
localStorage.removeItem("auth_token");

// Reindirizza alla pagina di login
window.location.href = "/auth/login";

// Messaggio per confermare l'esecuzione
console.log("Token rimosso, reindirizzamento alla pagina di login...");