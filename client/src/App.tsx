import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeToggle } from './components/theme/ThemeToggle';

// Dashboard ultra-semplificata
function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EXPERVISER CRM</h1>
          <p className="text-gray-600 dark:text-gray-400">Versione semplificata</p>
        </div>
        <ThemeToggle />
      </header>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900">
            <h3 className="font-medium text-blue-700 dark:text-blue-400">Contatti</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">94</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900">
            <h3 className="font-medium text-green-700 dark:text-green-400">Aziende</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">18</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900">
            <h3 className="font-medium text-purple-700 dark:text-purple-400">Opportunità</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">8</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Menu Principale</h3>
            <ul className="space-y-2">
              <li className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">Dashboard</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Contatti</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Aziende</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Opportunità</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Lead</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Sinergie</li>
              <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-200">Email</li>
            </ul>
          </div>
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Attività Recenti</h3>
            <ul className="space-y-2">
              <li className="p-2 border-b dark:border-gray-600 pb-2">
                <span className="block font-medium dark:text-white">Contatto aggiornato</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Mario Rossi - 20 Mag 2025</span>
              </li>
              <li className="p-2 border-b dark:border-gray-600 pb-2">
                <span className="block font-medium dark:text-white">Azienda aggiunta</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Acme Srl - 19 Mag 2025</span>
              </li>
              <li className="p-2 border-b dark:border-gray-600 pb-2">
                <span className="block font-medium dark:text-white">Opportunità aggiornata</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Progetto Fase 2 - 18 Mag 2025</span>
              </li>
              <li className="p-2">
                <span className="block font-medium dark:text-white">Email inviata</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Offerta commerciale - 18 Mag 2025</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <p className="text-center text-amber-700 dark:text-amber-400">
            Interfaccia temporanea. L'applicazione sta attraversando una manutenzione.
          </p>
        </div>
      </div>
    </div>
  );
}

// App principale semplificata al massimo
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Toaster />
        <SimpleDashboard />
      </ThemeProvider>
    </QueryClientProvider>
  );
}