import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading delle pagine
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
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
          
          {/* Pagina non trovata */}
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