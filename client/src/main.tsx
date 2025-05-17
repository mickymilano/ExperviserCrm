import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import './index.css';
import { debugContext } from './lib/debugContext';
import { initializeApiMonitoring } from './lib/monitoredFetch';

// Inizializza il sistema di debug
initializeApiMonitoring();

// Installa gli override della console
const resetConsole = debugContext.installConsoleOverrides();

// Log iniziale per verificare il funzionamento
debugContext.logInfo('Applicazione inizializzata', {
  time: new Date().toISOString(),
  environment: import.meta.env.MODE,
  userAgent: navigator.userAgent
}, { component: 'AppInit' });

// Inizializza Sentry per il monitoraggio degli errori
// Nota: in produzione, usare un DSN reale fornito da Sentry
Sentry.init({
  dsn: "", // Lasciato vuoto per evitare invio di dati in fase di sviluppo
  integrations: [],
  
  // Impostazioni consigliate per ambienti di produzione
  // tracesSampleRate: 1.0, // Cattura il 100% delle transazioni per le performance
  // normalizeDepth: 10, // Aumenta la profondità degli oggetti normalizzati
  
  // Ambiente condizionale basato sulla build
  environment: import.meta.env.MODE,
  
  // Disabilita in ambiente di sviluppo
  enabled: import.meta.env.MODE === 'production',
  
  // Filtra errori indesiderati
  beforeSend(event) {
    // Ignora errori delle estensioni del browser
    if (event.exception && event.exception.values && event.exception.values[0]) {
      const errorMsg = event.exception.values[0].value || '';
      if (errorMsg.includes('extension') || errorMsg.includes('Plugin')) {
        return null;
      }
    }
    return event;
  },
});;

// Theme Provider
import { ThemeProvider } from './components/layouts/ThemeProvider';

// Renderizza l'applicazione nel DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div className="error-boundary">
        <h2>Si è verificato un errore</h2>
        <p>Si è verificato un errore imprevisto. L'applicazione verrà ricaricata automaticamente tra 5 secondi.</p>
        <button onClick={() => window.location.reload()}>Ricarica ora</button>
      </div>
    }>
      <ThemeProvider defaultTheme="light" storageKey="experviser-theme">
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);