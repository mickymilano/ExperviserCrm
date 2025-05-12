import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Componenti e pagine
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

// Pagine pubbliche
import LoginPage from '@/pages/LoginPage';

// Pagine protette (lazy loaded per migliori performance)
import DashboardPage from '@/pages/DashboardPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Rotte pubbliche */}
        <Route path="/login" component={LoginPage} />
        
        {/* Rotte protette */}
        <Route path="/">
          <ProtectedRoute>
            <AppLayout>
              <Switch>
                <Route path="/" component={DashboardPage} />
                <Route path="/dashboard" component={DashboardPage} />
                
                {/* Pagina 404 */}
                <Route>
                  <div className="p-8 text-center">
                    <h1 className="text-4xl font-bold">404</h1>
                    <p className="mt-2 text-lg">Pagina non trovata</p>
                  </div>
                </Route>
              </Switch>
            </AppLayout>
          </ProtectedRoute>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}