import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function CacheReset() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalida tutte le query che contengono 'synergies' nel loro queryKey
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey.join('/');
        return key.includes('synergies');
      } 
    });

    console.log("CacheReset: Invalidazione cache sinergie completata");
  }, [queryClient]);

  // Questo componente non renderizza nulla
  return null;
}