import * as Sentry from "@sentry/react";

/**
 * Registra un errore con Sentry e lo stampa nella console
 * @param error - L'errore da registrare
 * @param context - Informazioni di contesto aggiuntive
 */
export function logError(error: unknown, context: Record<string, any> = {}): void {
  // Stampa sempre l'errore sulla console per il debug locale
  console.error("[ERROR]", error, context);

  // Non registriamo errori in Sentry durante lo sviluppo
  if (import.meta.env.DEV) {
    return;
  }

  // Registra l'errore in Sentry
  Sentry.captureException(error, {
    extra: context
  });
}

/**
 * Registra un messaggio informativo in Sentry
 * @param message - Il messaggio da registrare
 * @param context - Informazioni di contesto aggiuntive
 */
export function logMessage(message: string, context: Record<string, any> = {}): void {
  // Registra il messaggio in Sentry
  Sentry.captureMessage(message, {
    level: "info",
    extra: context
  });
}

/**
 * Registra un'operazione con le metriche di performance
 * @param name - Nome dell'operazione
 * @param operation - Funzione da eseguire
 * @param context - Informazioni di contesto aggiuntive
 * @returns Il risultato dell'operazione
 */
export async function trackOperation<T>(
  name: string,
  operation: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  // In versioni più recenti di Sentry si userebbe il metodo startTransaction
  // Per ora utilizziamo solo la funzionalità di base di logging
  console.time(`Operation: ${name}`);

  try {
    // Aggiungiamo bread per l'operazione
    Sentry.addBreadcrumb({
      category: 'operation',
      message: `Starting operation: ${name}`,
      data: context,
      level: 'info'
    });
    
    return await operation();
  } catch (error) {
    logError(error, { ...context, operationName: name });
    throw error;
  } finally {
    console.timeEnd(`Operation: ${name}`);
    
    // Aggiungiamo bread per la fine dell'operazione
    Sentry.addBreadcrumb({
      category: 'operation',
      message: `Finished operation: ${name}`,
      data: context,
      level: 'info'
    });
  }
}

/**
 * Wrapper per funzioni che potrebbero generare errori
 * @param fn - Funzione da eseguire
 * @param fallback - Valore di fallback in caso di errore
 * @param context - Informazioni di contesto aggiuntive
 * @returns Il risultato della funzione o il valore di fallback
 */
export function withErrorHandling<T>(
  fn: () => T,
  fallback: T,
  context: Record<string, any> = {}
): T {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}