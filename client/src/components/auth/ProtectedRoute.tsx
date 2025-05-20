import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { debugContext } from '../../lib/debugContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  
  // Verifica se l'utente è autenticato
  const { data: user, isError, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    // Controlla se siamo in modalità dev (per gestire il bypass di autenticazione)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Se non stiamo ancora caricando e c'è un errore (utente non autenticato)
    if (!isLoading && isError) {
      // In development, possiamo bypassare l'errore di autenticazione
      if (isDevelopment) {
        // Log per development
        console.log('Bypassando errore di autenticazione in development');
        setIsChecking(false);
      } else {
        // In produzione, reindirizza alla pagina di login
        setLocation('/login');
      }
    } else if (!isLoading) {
      // Abbiamo finito il controllo
      setIsChecking(false);
    }
  }, [isLoading, isError, setLocation]);
  
  // Mostra un loader mentre stiamo verificando lo stato dell'autenticazione
  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // Se abbiamo un utente o siamo in development, mostra il contenuto della pagina
  return <>{children}</>;
}