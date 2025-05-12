import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { formatCurrency } from '@/lib/utils';

// Icone
import {
  Users,
  Building2,
  DollarSign,
  UserPlus,
  TrendingUp,
  Clock,
  Star,
  List,
} from 'lucide-react';

export default function DashboardPage() {
  // Ottieni i dati essenziali per la dashboard
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['/api/contacts/stats'],
  });
  
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies/stats'],
  });
  
  const { data: dealsData, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['/api/deals/stats'],
  });
  
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/leads/stats'],
  });

  // Ottieni i dati delle opportunità per il grafico
  const { data: recentDeals, isLoading: isLoadingRecentDeals } = useQuery({
    queryKey: ['/api/deals/recent'],
  });

  // Ottieni contatti recenti
  const { data: recentContacts, isLoading: isLoadingRecentContacts } = useQuery({
    queryKey: ['/api/contacts/recent'],
  });

  // Ottieni attività recenti
  const { data: recentActivities, isLoading: isLoadingRecentActivities } = useQuery({
    queryKey: ['/api/activities/recent'],
  });

  // Stato di caricamento
  const isLoading = isLoadingContacts || isLoadingCompanies || isLoadingDeals || isLoadingLeads || 
                    isLoadingRecentDeals || isLoadingRecentContacts || isLoadingRecentActivities;

  // Statistiche principali per la dashboard
  const stats = [
    {
      title: 'Contatti',
      value: contactsData?.count || 0,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      link: '/contacts',
      change: contactsData?.percentChange || 0,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Aziende',
      value: companiesData?.count || 0,
      icon: <Building2 className="h-6 w-6 text-purple-600" />,
      link: '/companies',
      change: companiesData?.percentChange || 0,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Opportunità',
      value: dealsData?.count || 0,
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      link: '/deals',
      change: dealsData?.percentChange || 0,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Lead',
      value: leadsData?.count || 0,
      icon: <UserPlus className="h-6 w-6 text-orange-600" />,
      link: '/leads',
      change: leadsData?.percentChange || 0,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Intestazione pagina */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Benvenuto al tuo CRM. Ecco un riepilogo delle tue attività recenti.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Nuova attività
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
              Genera report
            </button>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Link key={index} href={stat.link}>
              <a className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />}
                    <span className="text-xs font-medium">{Math.abs(stat.change)}%</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">rispetto al mese scorso</span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* Contenuto principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunità recenti */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Opportunità recenti</h2>
              <Link href="/deals">
                <a className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Vedi tutte
                </a>
              </Link>
            </div>
            
            {isLoadingRecentDeals ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Azienda
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valore
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stato
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentDeals?.length > 0 ? (
                      recentDeals.slice(0, 5).map((deal: any) => (
                        <tr key={deal.id}>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Link href={`/deals/${deal.id}`}>
                              <a className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                {deal.name}
                              </a>
                            </Link>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {deal.company?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {deal.value ? formatCurrency(deal.value) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              deal.stage === 'Qualified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              deal.stage === 'Proposal' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              deal.stage === 'Negotiation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              deal.stage === 'Closed Won' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              deal.stage === 'Closed Lost' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {deal.stage || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Nessuna opportunità recente trovata
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Colonna laterale */}
          <div className="space-y-6">
            {/* Contatti recenti */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contatti recenti</h2>
                <Link href="/contacts">
                  <a className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Vedi tutti
                  </a>
                </Link>
              </div>
              
              {isLoadingRecentContacts ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentContacts?.length > 0 ? (
                    recentContacts.slice(0, 4).map((contact: any) => (
                      <div key={contact.id} className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </div>
                        <div className="ml-3">
                          <Link href={`/contacts/${contact.id}`}>
                            <a className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                              {contact.firstName} {contact.lastName}
                            </a>
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {contact.company?.name || 'Nessuna azienda'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Nessun contatto recente trovato
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Attività recenti */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attività recenti</h2>
                <Link href="/activities">
                  <a className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Vedi tutte
                  </a>
                </Link>
              </div>
              
              {isLoadingRecentActivities ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-8 w-8"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities?.length > 0 ? (
                    recentActivities.slice(0, 4).map((activity: any) => (
                      <div key={activity.id} className="flex items-start">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'call' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          activity.type === 'meeting' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                          activity.type === 'email' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          activity.type === 'task' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {activity.type === 'call' ? <PhoneIcon className="h-4 w-4" /> :
                           activity.type === 'meeting' ? <Users className="h-4 w-4" /> :
                           activity.type === 'email' ? <Mail className="h-4 w-4" /> :
                           activity.type === 'task' ? <CheckSquare className="h-4 w-4" /> :
                           <List className="h-4 w-4" />}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.date || 'Data non specificata'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Nessuna attività recente trovata
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Icone aggiuntive
function PhoneIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function Mail(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CheckSquare(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}