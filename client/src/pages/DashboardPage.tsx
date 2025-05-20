import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Building2, 
  Briefcase, 
  Target
} from 'lucide-react';

// Semplice componente per mostrare lo stato di caricamento
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 h-24">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
      
      <div className="bg-card border border-border rounded-lg p-4 mt-6">
        <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-muted rounded w-full"></div>
      </div>
    </div>
  );
}

// Componente semplificato per la dashboard
export default function DashboardPage() {
  const { t } = useTranslation();
  
  // Caricamento stats di base
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Preparazione dati sicuri
  const statsData = stats || {};
  
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard.title', 'Dashboard')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome_message', 'Benvenuto nella dashboard di Experviser CRM')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Contatti */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="font-medium">{t('dashboard.stats.contacts', 'Contatti')}</h2>
          </div>
          <p className="text-2xl font-bold">{statsData.contacts?.count || 0}</p>
        </div>
        
        {/* Card Aziende */}
        <div className="bg-violet-50 dark:bg-violet-900/10 rounded-lg p-4 border border-violet-100 dark:border-violet-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-violet-500" />
            <h2 className="font-medium">{t('dashboard.stats.companies', 'Aziende')}</h2>
          </div>
          <p className="text-2xl font-bold">{statsData.companies?.count || 0}</p>
        </div>
        
        {/* Card Opportunità */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-5 w-5 text-green-500" />
            <h2 className="font-medium">{t('dashboard.stats.opportunities', 'Opportunità')}</h2>
          </div>
          <p className="text-2xl font-bold">{statsData.deals?.count || 0}</p>
        </div>
        
        {/* Card Lead */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-100 dark:border-orange-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-orange-500" />
            <h2 className="font-medium">{t('dashboard.stats.leads', 'Lead')}</h2>
          </div>
          <p className="text-2xl font-bold">{statsData.leads?.count || 0}</p>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-xl font-medium mb-4">{t('dashboard.system_status', 'Stato del Sistema')}</h2>
        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
          <p className="text-center text-green-700 dark:text-green-400">{t('dashboard.system_online', 'Il sistema è attivo e funzionante')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium mb-4">{t('dashboard.recent_contacts', 'Contatti recenti')}</h2>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
            <p className="text-center text-blue-700 dark:text-blue-400">
              {t('dashboard.contacts_loading', 'Nessun contatto recente disponibile')}
            </p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium mb-4">{t('dashboard.recent_activities', 'Attività recenti')}</h2>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
            <p className="text-center text-purple-700 dark:text-purple-400">
              {t('dashboard.activities_loading', 'Nessuna attività recente disponibile')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}