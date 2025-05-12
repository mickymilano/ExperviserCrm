import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Configurazione di React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;