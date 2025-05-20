import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  Building2, 
  BarChart3, 
  ArrowUp, 
  ArrowDown, 
  Users2, 
  Share2,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  ChevronRight,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';

// Componente statistiche
function StatCard({ 
  title, 
  value, 
  icon, 
  change,
  changeType = 'neutral',
  loading = false
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 mt-1"></div>
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
            
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {changeType === 'positive' ? (
                  <ArrowUp size={14} className="text-green-500 mr-1" />
                ) : changeType === 'negative' ? (
                  <ArrowDown size={14} className="text-red-500 mr-1" />
                ) : null}
                <span className={`text-xs font-medium ${
                  changeType === 'positive' 
                    ? 'text-green-500' 
                    : changeType === 'negative' 
                      ? 'text-red-500' 
                      : 'text-gray-500'
                }`}>
                  {change > 0 ? '+' : ''}{change}% rispetto al mese scorso
                </span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tabella attività recenti
function RecentActivitiesTable() {
  const activities = [
    { 
      id: 1, 
      type: 'contact', 
      name: 'Mario Rossi', 
      action: 'Contatto aggiornato', 
      date: '20 Mag 2025', 
      time: '14:30'
    },
    { 
      id: 2, 
      type: 'company', 
      name: 'Acme Srl', 
      action: 'Azienda aggiunta', 
      date: '19 Mag 2025', 
      time: '10:45'
    },
    { 
      id: 3, 
      type: 'deal', 
      name: 'Progetto Fase 2', 
      action: 'Opportunità aggiornata', 
      date: '18 Mag 2025', 
      time: '16:20'
    },
    { 
      id: 4, 
      type: 'email', 
      name: 'Offerta commerciale', 
      action: 'Email inviata', 
      date: '18 Mag 2025', 
      time: '09:15'
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Users size={16} className="text-blue-500" />;
      case 'company':
        return <Building2 size={16} className="text-green-500" />;
      case 'deal':
        return <BarChart3 size={16} className="text-purple-500" />;
      case 'email':
        return <Mail size={16} className="text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Attività</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Dettagli</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Data</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {activities.map((activity) => (
              <tr key={activity.id} className="border-b transition-colors hover:bg-gray-50">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    {getIcon(activity.type)}
                    <span className="font-medium">{activity.action}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">{activity.name}</td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <span>{activity.date}</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente promemoria
function RemindersCard() {
  const reminders = [
    { 
      id: 1, 
      title: 'Chiamata con cliente', 
      date: '20 Mag 2025', 
      time: '15:00', 
      completed: false 
    },
    { 
      id: 2, 
      title: 'Invio offerta commerciale', 
      date: '21 Mag 2025', 
      time: '10:00', 
      completed: false 
    },
    { 
      id: 3, 
      title: 'Review contratto', 
      date: '19 Mag 2025', 
      time: '14:30', 
      completed: true 
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Promemoria</CardTitle>
          <Button variant="ghost" size="icon">
            <Filter size={16} />
          </Button>
        </div>
        <CardDescription>Attività programmate e promemoria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1 ${reminder.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {reminder.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${reminder.completed ? 'line-through text-gray-500' : ''}`}>
                  {reminder.title}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar size={14} className="mr-1" />
                  <span>{reminder.date} - {reminder.time}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight size={16} />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full mt-2">Visualizza tutti</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Pagina Dashboard principale
export default function ModernDashboard() {
  // Simuliamo un caricamento iniziale
  const [loading, setLoading] = useState(true);

  // Dati statistiche
  const dashboardStats = {
    contacts: 94,
    companies: 18,
    deals: 8,
    leads: 4,
    synergies: 5
  };

  // Simuliamo una chiamata API
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panoramica del tuo CRM e attività recenti.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard 
          title="Contatti" 
          value={dashboardStats.contacts} 
          icon={<Users size={24} />} 
          change={5.2} 
          changeType="positive"
          loading={loading}
        />
        <StatCard 
          title="Aziende" 
          value={dashboardStats.companies} 
          icon={<Building2 size={24} />} 
          change={2.1} 
          changeType="positive"
          loading={loading}
        />
        <StatCard 
          title="Opportunità" 
          value={dashboardStats.deals} 
          icon={<BarChart3 size={24} />} 
          change={-1.5} 
          changeType="negative"
          loading={loading}
        />
        <StatCard 
          title="Lead" 
          value={dashboardStats.leads} 
          icon={<Users2 size={24} />} 
          change={8.3} 
          changeType="positive"
          loading={loading}
        />
        <StatCard 
          title="Sinergie" 
          value={dashboardStats.synergies} 
          icon={<Share2 size={24} />} 
          loading={loading}
        />
      </div>
      
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Attività recenti</TabsTrigger>
          <TabsTrigger value="stats">Prestazioni</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attività recenti</CardTitle>
                  <CardDescription>Le ultime operazioni eseguite nel CRM.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivitiesTable />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1">
              <RemindersCard />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Prestazioni</CardTitle>
              <CardDescription>Analisi e metriche delle prestazioni.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center border border-dashed rounded-md">
                <p className="text-gray-500">Statistiche in costruzione</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}