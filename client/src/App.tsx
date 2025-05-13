import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading delle pagine
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ContactsPage = lazy(() => import('@/pages/contacts'));
const CompaniesPage = lazy(() => import('@/pages/companies'));
const DealsPage = lazy(() => import('@/pages/deals'));
const LeadsPage = lazy(() => import('@/pages/leads'));
const SynergiesPage = lazy(() => import('@/pages/synergies'));
const TasksPage = lazy(() => import('@/pages/tasks'));
const CalendarPage = lazy(() => import('@/pages/calendar'));
const EmailPage = lazy(() => import('@/pages/email'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const HelpPage = lazy(() => import('@/pages/help'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

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
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          {/* Pagina di login (senza layout AppLayout) */}
          <Route path="/login" component={LoginPage} />
          
          {/* Pagine protette (con layout AppLayout) */}
          <Route path="/">
            <ProtectedRoute>
              <LayoutPage component={DashboardPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Contacts */}
          <Route path="/contacts">
            <ProtectedRoute>
              <LayoutPage component={ContactsPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Companies */}
          <Route path="/companies">
            <ProtectedRoute>
              <LayoutPage component={CompaniesPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Deals */}
          <Route path="/deals">
            <ProtectedRoute>
              <LayoutPage component={DealsPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Leads */}
          <Route path="/leads">
            <ProtectedRoute>
              <LayoutPage component={LeadsPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Synergies */}
          <Route path="/synergies">
            <ProtectedRoute>
              <LayoutPage component={SynergiesPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Calendar */}
          <Route path="/calendar">
            <ProtectedRoute>
              <LayoutPage component={CalendarPage} />
            </ProtectedRoute>
          </Route>
          
          {/* Route for Email */}
          <Route path="/emails">
            <ProtectedRoute>
              <LayoutPage component={EmailPage} />
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