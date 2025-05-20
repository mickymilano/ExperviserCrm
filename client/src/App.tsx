import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import ModernLayout from './components/layout/ModernLayout';

// Caricamento pigro delle pagine
const ModernDashboard = lazy(() => import('./pages/ModernDashboard'));

// Pagina di caricamento
function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </div>
    </div>
  );
}

// Pagina di login semplificata
function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-700">EXPERVISER CRM</h1>
          <p className="text-gray-600 mt-2">La piattaforma avanzata per la gestione delle relazioni con i clienti</p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Accedi al tuo account</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="admin@experviser.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="********"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked 
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Ricordami</label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">Password dimenticata?</a>
            </div>
            <button
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-150 ease-in-out"
              onClick={() => {
                // Semplice reindirizzamento alla dashboard senza autenticazione
                window.location.href = '/';
              }}
            >
              Accedi
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Modalità sviluppo attiva - Accesso diretto alla dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// App principale
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/">
            <ModernLayout>
              <ModernDashboard />
            </ModernLayout>
          </Route>
        </Switch>
      </Suspense>
    </QueryClientProvider>
  );
}