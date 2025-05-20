import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DebugProvider from './components/debug/DebugProvider';
import { Toaster } from './components/ui/toaster';

// Lazy loading delle pagine
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

// Contacts
const ContactsPage = lazy(() => import('@/pages/contacts'));
const ContactDetailPage = lazy(() => import('@/pages/contacts/[id]'));

// Companies
const CompaniesPage = lazy(() => import('@/pages/companies'));
const CompanyDetailPage = lazy(() => import('@/pages/companies/[id]'));

// Deals
const DealsPage = lazy(() => import('@/pages/deals'));
const DealDetailPage = lazy(() => import('@/pages/deals/[id]'));

// Email
const EmailPage = lazy(() => import('@/pages/email'));
const EmailSignaturesPage = lazy(() => import('@/pages/email/signatures'));

// Other modules
const LeadsPage = lazy(() => import('@/pages/leads'));
const SynergiesPage = lazy(() => import('@/pages/synergies'));
const TasksPage = lazy(() => import('@/pages/tasks'));
const CalendarPage = lazy(() => import('@/pages/calendar'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const HelpPage = lazy(() => import('@/pages/help'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Branches module
const BranchesPage = lazy(() => import('@/pages/branches'));
const BranchDetailPage = lazy(() => import('@/pages/branches/[id]'));

// Componente di caricamento
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

// Pagina con layout applicazione
function LayoutPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Componente per notifiche toast */}
      <Toaster />
      
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          {/* Pagina di login (senza layout AppLayout) */}
          <Route path="/login" component={LoginPage} />
          {/* Aggiungiamo anche il percorso alternativo per il login */}
          <Route path="/auth/login" component={LoginPage} />
          
          {/* Pagine protette (con layout AppLayout) */}
          <Route path="/">
            <ProtectedRoute>
              <LayoutPage component={DashboardPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Contacts */}
          <Route path="/contacts/new">
            <ProtectedRoute>
              <LayoutPage component={ContactsPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/contacts/:id">
            <ProtectedRoute>
              <LayoutPage component={ContactDetailPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/contacts">
            <ProtectedRoute>
              <LayoutPage component={ContactsPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Companies */}
          <Route path="/companies">
            <ProtectedRoute>
              <LayoutPage component={CompaniesPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/companies/:id">
            <ProtectedRoute>
              <LayoutPage component={CompanyDetailPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Deals */}
          <Route path="/deals">
            <ProtectedRoute>
              <LayoutPage component={DealsPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/deals/new">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/deals/new'))} />
            </ProtectedRoute>
          </Route>
          <Route path="/deals/:id">
            <ProtectedRoute>
              <LayoutPage component={DealDetailPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Leads */}
          <Route path="/leads">
            <ProtectedRoute>
              <LayoutPage component={LeadsPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/leads/:id">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/leads/[id]'))} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Synergies */}
          <Route path="/synergies">
            <ProtectedRoute>
              <LayoutPage component={SynergiesPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Tasks */}
          <Route path="/tasks">
            <ProtectedRoute>
              <LayoutPage component={TasksPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Calendar */}
          <Route path="/calendar">
            <ProtectedRoute>
              <LayoutPage component={CalendarPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Email */}
          <Route path="/emails/inbox">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/email/inbox'))} />
            </ProtectedRoute>
          </Route>
          <Route path="/emails/compose">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/email/compose'))} />
            </ProtectedRoute>
          </Route>
          <Route path="/emails/signatures">
            <ProtectedRoute>
              <LayoutPage component={EmailSignaturesPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/emails/accounts">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/email/accounts'))} />
            </ProtectedRoute>
          </Route>
          <Route path="/emails/settings">
            <ProtectedRoute>
              <LayoutPage component={lazy(() => import('@/pages/email/settings'))} />
            </ProtectedRoute>
          </Route>
          <Route path="/emails">
            <ProtectedRoute>
              <LayoutPage component={EmailPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Routes for Branches */}
          <Route path="/branches">
            <ProtectedRoute>
              <LayoutPage component={BranchesPage} />
            </ProtectedRoute>
          </Route>
          <Route path="/branches/:id">
            <ProtectedRoute>
              <LayoutPage component={BranchDetailPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Settings */}
          <Route path="/settings">
            <ProtectedRoute>
              <LayoutPage component={SettingsPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Help */}
          <Route path="/help">
            <ProtectedRoute>
              <LayoutPage component={HelpPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Pagina non trovata - catch all route */}
          <Route>
            <ProtectedRoute>
              <LayoutPage component={NotFoundPage} />
            </ProtectedRoute>
          </Route>
        </Switch>
      </Suspense>
    </QueryClientProvider>
  );
}