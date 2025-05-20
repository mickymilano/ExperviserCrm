import { useQuery } from "@tanstack/react-query";
import SummaryCards from "../../components/dashboard/SummaryCards";
import DealPipeline from "../../components/dashboard/DealPipeline";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import UpcomingMeetings from "../../components/dashboard/UpcomingMeetings";
import RecentContacts from "../../components/dashboard/RecentContacts";
import AISuggestions from "../../components/dashboard/AISuggestions";
import { Skeleton } from "../../components/ui/skeleton";
import { DashboardData } from "../../types";
import { debugContext } from "../../lib/debugContext";
import { useEffect } from "react";

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });
  
  // Aggiungiamo alcuni log di test al caricamento della dashboard
  useEffect(() => {
    debugContext.logInfo('Dashboard caricata', { timestamp: new Date().toISOString() }, { component: 'Dashboard' });
    
    // Aggiungiamo un log di ogni tipo per testare
    debugContext.logDebug('Test log di debug', { testId: 1 }, { component: 'Dashboard' });
    debugContext.logWarning('Test log di warning', { testId: 2 }, { component: 'Dashboard' });
    
    // Test errore (non blocca l'esecuzione)
    try {
      // Simuliamo un errore per testare il logging
      throw new Error('Errore simulato per test');
    } catch (error) {
      debugContext.logError('Test log di errore', error, { component: 'Dashboard' });
    }
  }, []);

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Errore durante il caricamento dei dati</h2>
          <p>Riprova più tardi o contatta l'assistenza se il problema persiste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Title (Mobile) */}
      <div className="flex justify-between items-center mb-6 md:hidden">
        <h1 className="text-xl font-semibold text-neutral-dark">Dashboard</h1>
      </div>
      
      {/* Dashboard Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <SummaryCards summary={data?.summary} />
      )}
      
      {/* Deal Pipeline & Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Deal Pipeline */}
        {isLoading ? (
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <DealPipeline dealsByStage={data?.dealsByStage} />
        )}
        
        {/* Activity Feed */}
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ActivityFeed activities={data?.recentActivities} />
        )}
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Meetings */}
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <UpcomingMeetings meetings={data?.upcomingMeetings} />
        )}
        
        {/* Recent Contacts & AI Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Contacts */}
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <RecentContacts contacts={data?.recentContacts} />
          )}
          
          {/* AI Suggestions */}
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <AISuggestions />
          )}
        </div>
      </div>
    </div>
  );
}
