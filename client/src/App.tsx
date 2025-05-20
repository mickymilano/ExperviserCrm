import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';

// Dashboard ultra-semplificata
function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">EXPERVISER CRM</h1>
        <p className="text-gray-600">Versione semplificata</p>
      </header>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-700">Contatti</h3>
            <p className="text-2xl font-bold mt-2">94</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-700">Aziende</h3>
            <p className="text-2xl font-bold mt-2">18</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-700">Opportunità</h3>
            <p className="text-2xl font-bold mt-2">8</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3">Menu Principale</h3>
            <ul className="space-y-2">
              <li className="p-2 bg-blue-50 text-blue-700 rounded font-medium">Dashboard</li>
              <li className="p-2 hover:bg-gray-100 rounded">Contatti</li>
              <li className="p-2 hover:bg-gray-100 rounded">Aziende</li>
              <li className="p-2 hover:bg-gray-100 rounded">Opportunità</li>
              <li className="p-2 hover:bg-gray-100 rounded">Lead</li>
              <li className="p-2 hover:bg-gray-100 rounded">Sinergie</li>
              <li className="p-2 hover:bg-gray-100 rounded">Email</li>
            </ul>
          </div>
          
          <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3">Attività Recenti</h3>
            <ul className="space-y-2">
              <li className="p-2 border-b pb-2">
                <span className="block font-medium">Contatto aggiornato</span>
                <span className="text-sm text-gray-500">Mario Rossi - 20 Mag 2025</span>
              </li>
              <li className="p-2 border-b pb-2">
                <span className="block font-medium">Azienda aggiunta</span>
                <span className="text-sm text-gray-500">Acme Srl - 19 Mag 2025</span>
              </li>
              <li className="p-2 border-b pb-2">
                <span className="block font-medium">Opportunità aggiornata</span>
                <span className="text-sm text-gray-500">Progetto Fase 2 - 18 Mag 2025</span>
              </li>
              <li className="p-2">
                <span className="block font-medium">Email inviata</span>
                <span className="text-sm text-gray-500">Offerta commerciale - 18 Mag 2025</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-center text-amber-700">
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
      <Toaster />
      <SimpleDashboard />
    </QueryClientProvider>
  );
}