import { useQuery } from '@tanstack/react-query';
import {
  User,
  Building2,
  Briefcase,
  Target,
  Mail,
  Phone,
  Clock,
  Calendar
} from 'lucide-react';
import { SynergiesOverview } from '@/components/dashboard/SynergiesOverview';

// Componente per mostrare lo stato di caricamento
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Scheletro delle card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 h-32">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        ))}
      </div>
      
      {/* Scheletro delle sezioni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-16 bg-muted rounded-lg mb-2"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente card per le statistiche
interface StatCardProps {
  title: string;
  value: number;
  percentChange: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, percentChange, icon, color }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <div className={`flex items-center mt-1 ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span className="text-xs font-medium">
              {percentChange >= 0 ? '+' : ''}{percentChange}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">rispetto al mese scorso</span>
          </div>
        </div>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Componente per le attività recenti
interface ActivityItemProps {
  title: string;
  description: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  createdAt: Date;
}

function ActivityItem({ title, description, type, createdAt }: ActivityItemProps) {
  // Icona in base al tipo di attività
  const getIcon = () => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Formatta la data
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) {
      return `${days} giorn${days === 1 ? 'o' : 'i'} fa`;
    } else if (hours > 0) {
      return `${hours} or${hours === 1 ? 'a' : 'e'} fa`;
    } else {
      return `${minutes} minut${minutes === 1 ? 'o' : 'i'} fa`;
    }
  };
  
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start">
        <div className="p-2 bg-primary/10 rounded-full mr-3">
          {getIcon()}
        </div>
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente per i contatti recenti
interface ContactItemProps {
  id: number;
  fullName: string;
  email: string;
  company?: string;
}

function ContactItem({ id, fullName, email, company }: ContactItemProps) {
  // Usa un valore di default per fullName nel caso sia undefined o null
  const displayName = fullName || "Senza Nome";
  
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">{displayName}</h4>
          <p className="text-xs text-muted-foreground">{email || "Email non disponibile"}</p>
          {company && <p className="text-xs text-muted-foreground">Azienda: {company}</p>}
        </div>
        <a href={`/contacts/${id}`} className="text-xs font-medium text-primary hover:underline">
          Visualizza
        </a>
      </div>
    </div>
  );
}

// Componente per le opportunità recenti
interface DealItemProps {
  id: number;
  title: string;
  value: number;
  company?: string;
  stage: string;
}

function DealItem({ id, title, value, company, stage }: DealItemProps) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
          <Briefcase size={16} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">{title}</h4>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">€{value.toLocaleString('it-IT')}</span>
            {company && <span className="mx-1">•</span>}
            {company && <span>{company}</span>}
          </div>
          <p className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
            {stage}
          </p>
        </div>
        <a href={`/deals/${id}`} className="text-xs font-medium text-primary hover:underline">
          Visualizza
        </a>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Dati statistiche dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/overview'],
  });
  
  // Dati attività recenti
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
  });
  
  // Dati contatti recenti
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts/recent'],
  });
  
  // Dati opportunità recenti
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals/recent'],
  });
  
  // Mostra scheletro durante il caricamento
  if (statsLoading || activitiesLoading || contactsLoading || dealsLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica delle attività recenti e delle performance</p>
      </div>
      
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard
          title="Contatti"
          value={stats && typeof stats === 'object' && stats.contacts && typeof stats.contacts === 'object' ? stats.contacts.count || 0 : 0}
          percentChange={stats && typeof stats === 'object' && stats.contacts && typeof stats.contacts === 'object' ? stats.contacts.percentChange || 0 : 0}
          icon={<User className="h-5 w-5 text-blue-500" />}
          color="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard
          title="Aziende"
          value={stats && typeof stats === 'object' && stats.companies && typeof stats.companies === 'object' ? stats.companies.count || 0 : 0}
          percentChange={stats && typeof stats === 'object' && stats.companies && typeof stats.companies === 'object' ? stats.companies.percentChange || 0 : 0}
          icon={<Building2 className="h-5 w-5 text-violet-500" />}
          color="bg-violet-100 dark:bg-violet-900/20"
        />
        <StatCard
          title="Filiali"
          value={stats && typeof stats === 'object' && stats.branches ? stats.branches : 0}
          percentChange={3.5} {/* Percentuale simulata */}
          icon={<Building2 className="h-5 w-5 text-cyan-500" />}
          color="bg-cyan-100 dark:bg-cyan-900/20"
        />
        <StatCard
          title="Opportunità"
          value={stats && typeof stats === 'object' && stats.deals && typeof stats.deals === 'object' ? stats.deals.count || 0 : 0}
          percentChange={stats && typeof stats === 'object' && stats.deals && typeof stats.deals === 'object' ? stats.deals.percentChange || 0 : 0}
          icon={<Briefcase className="h-5 w-5 text-green-500" />}
          color="bg-green-100 dark:bg-green-900/20"
        />
        <StatCard
          title="Lead"
          value={stats && typeof stats === 'object' && stats.leads && typeof stats.leads === 'object' ? stats.leads.count || 0 : 0}
          percentChange={stats && typeof stats === 'object' && stats.leads && typeof stats.leads === 'object' ? stats.leads.percentChange || 0 : 0}
          icon={<Target className="h-5 w-5 text-orange-500" />}
          color="bg-orange-100 dark:bg-orange-900/20"
        />
      </div>
      
      {/* Contenuto principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attività recenti */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-medium">Attività recenti</h2>
          </div>
          <div className="p-4">
            {Array.isArray(activities) && activities.length > 0 ? (
              activities.map((activity: any) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title || "Attività"}
                  description={activity.description || "Nessuna descrizione"}
                  type={activity.type || "note"}
                  createdAt={new Date(activity.createdAt || new Date())}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nessuna attività recente</p>
            )}
          </div>
        </div>
        
        {/* Contatti recenti */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-medium">Contatti recenti</h2>
          </div>
          <div className="p-4">
            {Array.isArray(contacts) && contacts.length > 0 ? (
              contacts.map((contact: any) => (
                <ContactItem
                  key={contact.id}
                  id={contact.id || 0}
                  fullName={contact.fullName || ""}
                  email={contact.email || ""}
                  company={contact.companyName}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nessun contatto recente</p>
            )}
          </div>
        </div>
        
        {/* Opportunità recenti */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-medium">Opportunità recenti</h2>
          </div>
          <div className="p-4">
            {Array.isArray(deals) && deals.length > 0 ? (
              deals.map((deal: any) => (
                <DealItem
                  key={deal.id}
                  id={deal.id || 0}
                  title={deal.title || "Opportunità senza titolo"}
                  value={deal.value || 0}
                  company={deal.companyName}
                  stage={deal.stageName || "Fase non specificata"}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nessuna opportunità recente</p>
            )}
          </div>
        </div>
        
        {/* Panoramica delle sinergie */}
        <SynergiesOverview />
      </div>
    </div>
  );
}