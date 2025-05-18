import { toast } from "@/hooks/use-toast";

/**
 * Mostra una notifica di operazione completata con successo
 * @param message Messaggio da visualizzare (default "Salvataggio completato")
 */
export function showSuccessNotification(message: string = "Salvataggio completato") {
  toast({
    title: "Operazione completata",
    description: message,
    variant: "default",
    className: "bg-green-600 text-white border-green-700", // Sfondo verde
    duration: 3000, // 3 secondi
  });
}

/**
 * Mostra una notifica di errore 
 * @param message Messaggio di errore da visualizzare (default "Errore durante il salvataggio")
 */
export function showErrorNotification(message: string = "Errore durante il salvataggio") {
  toast({
    title: "Errore",
    description: message,
    variant: "destructive", // Il tema destructive è già rosso
    className: "bg-red-600 text-white border-red-700", // Personalizzato ulteriormente
    duration: 3000, // 3 secondi
  });
}

/**
 * Intercetta le richieste API e mostra automaticamente notifiche di successo o errore
 * @param url URL della richiesta API
 * @param options Opzioni della richiesta
 * @returns Promise con il risultato della richiesta
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    // Verifica se è una operazione di scrittura (POST, PATCH, PUT, DELETE)
    const isWriteOperation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method || '');
    
    if (!response.ok) {
      // Se la risposta non è ok, mostra un errore
      const errorData = await response.json().catch(() => ({ message: "Errore sconosciuto" }));
      const errorMessage = errorData.message || `Errore ${response.status}: ${response.statusText}`;
      
      if (isWriteOperation) {
        showErrorNotification(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    // Se è una operazione di scrittura e tutto è andato bene, mostra successo
    if (isWriteOperation) {
      const operationMap: {[key: string]: string} = {
        'POST': 'creazione',
        'PATCH': 'aggiornamento',
        'PUT': 'aggiornamento',
        'DELETE': 'eliminazione'
      };
      
      const operationType = operationMap[options.method || ''] || 'salvataggio';
      showSuccessNotification(`${operationType.charAt(0).toUpperCase() + operationType.slice(1)} completato`);
    }
    
    // Se è JSON, restituisci i dati JSON, altrimenti la risposta completa
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error: any) {
    // Se è una operazione di scrittura, mostra un errore
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method || '')) {
      showErrorNotification(error.message || "Errore durante l'operazione");
    }
    
    throw error;
  }
}