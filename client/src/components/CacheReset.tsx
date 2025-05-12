import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function CacheReset() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // NON solo invalidare, ma RIMUOVERE completamente tutte le query relative alle sinergie
    queryClient.removeQueries({ 
      predicate: (query) => {
        // Conversione uniforme del queryKey in stringa per il matching
        const key = Array.isArray(query.queryKey) 
          ? query.queryKey.join('/') 
          : String(query.queryKey);
          
        return key.includes('synergies') || key.includes('synergiesByCompany') || key.includes('synergiesByContact');
      } 
    });

    // Forza pulizia cache anche per entità correlate per sicurezza
    queryClient.refetchQueries({ queryKey: ['/api/companies'] });
    queryClient.refetchQueries({ queryKey: ['/api/contacts'] });
    queryClient.refetchQueries({ queryKey: ['/api/deals'] });

    console.log("CacheReset: Pulizia completa cache sinergie e refetch entità correlate completato");
  }, [queryClient]);

  // Questo componente non renderizza nulla, ma è fondamentale per garantire
  // che non ci siano dati fantasma nel frontend
  return null;
}