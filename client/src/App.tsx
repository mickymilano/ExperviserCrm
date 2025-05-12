import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Componenti
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pagine
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        
        {/* Rotte protette */}
        <Route path="/">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        
        {/* Rotte per Contatti */}
        <Route path="/contacts">
          <ProtectedRoute>
            <div>Pagina dei contatti (da implementare)</div>
          </ProtectedRoute>
        </Route>
        <Route path="/contacts/:id">
          <ProtectedRoute>
            <div>Dettagli contatto (da implementare)</div>
          </ProtectedRoute>
        </Route>
        
        {/* Rotte per Aziende */}
        <Route path="/companies">
          <ProtectedRoute>
            <div>Pagina delle aziende (da implementare)</div>
          </ProtectedRoute>
        </Route>
        <Route path="/companies/:id">
          <ProtectedRoute>
            <div>Dettagli azienda (da implementare)</div>
          </ProtectedRoute>
        </Route>
        
        {/* Rotte per Opportunità */}
        <Route path="/deals">
          <ProtectedRoute>
            <div>Pagina delle opportunità (da implementare)</div>
          </ProtectedRoute>
        </Route>
        <Route path="/deals/:id">
          <ProtectedRoute>
            <div>Dettagli opportunità (da implementare)</div>
          </ProtectedRoute>
        </Route>
        
        {/* Rotte per Lead */}
        <Route path="/leads">
          <ProtectedRoute>
            <div>Pagina dei lead (da implementare)</div>
          </ProtectedRoute>
        </Route>
        <Route path="/leads/:id">
          <ProtectedRoute>
            <div>Dettagli lead (da implementare)</div>
          </ProtectedRoute>
        </Route>
        
        {/* Rotta per Impostazioni */}
        <Route path="/settings">
          <ProtectedRoute>
            <div>Pagina delle impostazioni (da implementare)</div>
          </ProtectedRoute>
        </Route>
        
        {/* Fallback per rotte non trovate */}
        <Route>
          <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Pagina non trovata</p>
              <a
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Torna alla Dashboard
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}