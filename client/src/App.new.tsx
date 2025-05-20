import React, { Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';

// Pagina di caricamento semplice
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

// Layout base semplificato
function BasicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl font-bold text-gray-800">EXPERVISER CRM</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

// Dashboard semplificata
function SimpleDashboard() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800">Contatti</h3>
          <p className="text-2xl font-bold mt-2">94</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <h3 className="font-medium text-green-800">Aziende</h3>
          <p className="text-2xl font-bold mt-2">18</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <h3 className="font-medium text-purple-800">Opportunità</h3>
          <p className="text-2xl font-bold mt-2">8</p>
        </div>
      </div>
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <p className="text-center text-amber-700">
          Interfaccia temporanea. L'applicazione sta attraversando una manutenzione.
        </p>
      </div>
    </div>
  );
}

// Pagina di login semplificata
function SimpleLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">EXPERVISER CRM</h1>
          <p className="text-gray-600">Accedi alla piattaforma</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <p className="mb-4 text-center text-gray-700">
            Login temporaneamente semplificato per manutenzione
          </p>
          <button
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => {
              // Semplice reindirizzamento alla dashboard senza autenticazione
              window.location.href = '/';
            }}
          >
            Accedi
          </button>
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
          <Route path="/login" component={SimpleLoginPage} />
          <Route path="/">
            <BasicLayout>
              <SimpleDashboard />
            </BasicLayout>
          </Route>
        </Switch>
      </Suspense>
    </QueryClientProvider>
  );
}