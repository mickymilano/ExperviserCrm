import React from 'react';
import { useLocation } from 'wouter';

const DashboardPage: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLocation('/login');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 text-sm font-medium text-gray-500">Contatti Attivi</div>
          <div className="text-3xl font-bold text-gray-900">--</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 text-sm font-medium text-gray-500">Aziende Attive</div>
          <div className="text-3xl font-bold text-gray-900">--</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 text-sm font-medium text-gray-500">Trattative Aperte</div>
          <div className="text-3xl font-bold text-gray-900">--</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 text-sm font-medium text-gray-500">Valore Trattative</div>
          <div className="text-3xl font-bold text-gray-900">--</div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Ricostruzione CRM in corso...</h2>
        <p className="text-gray-600">
          Il CRM è attualmente in fase di ricostruzione secondo l'approccio modulare CIDER:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-gray-600">
          <li><strong>C</strong>lean - Codice pulito e ben strutturato</li>
          <li><strong>I</strong>solated - Componenti isolati e riutilizzabili</li>
          <li><strong>D</strong>ecoupled - Logica disaccoppiata dalla UI</li>
          <li><strong>E</strong>xplicit - Relazioni esplicite tra entità</li>
          <li><strong>R</strong>obust - Sistema robusto con gestione errori</li>
        </ul>
        <p className="mt-4 text-gray-600">
          Fase attuale: 0.1 - Codebase Pruning (Application Logic Reset)
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;