/**
 * Uno script per reimpostare completamente l'autenticazione per i test
 * Come utilizzare:
 * 1. Importa questo script nella console del browser
 * 2. Chiama la funzione resetAuth() per eliminare tutti i token e reindirizzare alla pagina di login
 */

export function resetAuth() {
  // Elimina token e dati di sessione
  localStorage.removeItem('auth_token');
  sessionStorage.clear();
  
  // Rimuovi tutti i cookie (possono contenere informazioni di sessione)
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  console.log("Autenticazione reimpostata, reindirizzamento alla pagina di login...");
  
  // Reindirizzamento con timestamp per evitare la cache
  window.location.href = `/auth/login?t=${Date.now()}`;
  
  return "Reindirizzamento in corso...";
}

// Esegui automaticamente se caricato direttamente
if (typeof window !== 'undefined') {
  resetAuth();
}