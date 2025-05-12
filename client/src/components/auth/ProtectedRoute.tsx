import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Stato di caricamento durante la verifica dell'autenticazione
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium">Verifica autenticazione...</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/reset-password/:token');
  
  // Usa React Query per verificare lo stato di autenticazione
  const { data: auth, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/status'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
  
  // Se il token di reset password è presente nell'URL, mostra il contenuto
  const isResetPasswordRoute = params !== null;
  
  useEffect(() => {
    // Se non ci sono errori o stiamo caricando, non facciamo nulla
    if (isLoading || (!isError && auth?.authenticated)) return;
    
    // Se c'è un errore e non siamo nella pagina di reset password, reindirizza al login
    if (!isResetPasswordRoute) {
      setLocation('/login');
    }
  }, [isLoading, isError, auth, setLocation, isResetPasswordRoute]);
  
  // Mostra stato di caricamento durante la verifica
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Se autenticato o nella pagina di reset password, mostra i figli
  if (auth?.authenticated || isResetPasswordRoute) {
    return <>{children}</>;
  }
  
  // Fallback - non dovremmo mai arrivare qui grazie all'useEffect
  return null;
}