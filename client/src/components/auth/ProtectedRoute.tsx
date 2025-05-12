import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verifica lo stato di autenticazione
        const response = await apiRequest('/auth/check');
        setIsAuthenticated(response.authenticated);
      } catch (error) {
        setIsAuthenticated(false);
        console.error('Errore durante la verifica dell\'autenticazione:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  // Reindirizza alla pagina di login se non autenticato
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Mostra un loader durante la verifica dell'autenticazione
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Renderizza i figli solo se autenticato
  return isAuthenticated ? <>{children}</> : null;
}