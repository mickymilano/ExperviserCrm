import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

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
    // Se non stiamo ancora caricando e c'è un errore (utente non autenticato)
    if (!isLoading && isError) {
      // Reindirizza alla pagina di login
      setLocation('/login');
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
  
  // Se abbiamo un utente, mostra il contenuto della pagina
  return <>{children}</>;
}