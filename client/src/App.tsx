import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layouts/AppLayout";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import ContactDetail from "@/pages/contacts/[id]";
import Leads from "@/pages/leads";
import Companies from "@/pages/companies";
import CompanyDetail from "@/pages/companies/[id]";
import Deals from "@/pages/deals";
import DealDetail from "@/pages/deals/[id]";
import NewDeal from "@/pages/deals/new";
import Synergies from "@/pages/synergies";
import Email from "@/pages/email";
import EmailAccounts from "@/pages/email/accounts";
import EmailSettings from "@/pages/email/settings";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/auth/login";
// Debug imports removed
import { useAuth } from "@/hooks/useAuth";
import { CacheReset } from "@/components/CacheReset";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  // IMPORTANTE: mantenere un ordine costante degli hooks
  // Salva il token in una variabile per evitare accessi multipli a localStorage
  const hasToken = !!localStorage.getItem("auth_token");
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  console.log("Protected route auth status:", { 
    isAuthenticated, 
    isLoading, 
    userExists: !!user, 
    hasToken
  });
  
  useEffect(() => {
    // Only redirect if we're sure there's no valid token AND user data couldn't be loaded
    if (!isLoading && !hasToken) {
      console.log("No token found, redirecting to login");
      setLocation("/auth/login");
      return;
    }
    
    // Se non siamo autenticati e il token non funziona (no user data)
    if (!isLoading && !isAuthenticated && !user && hasToken) {
      console.log("Token exists but not authenticated, clearing token");
      localStorage.removeItem("auth_token");
      setLocation("/auth/login");
    }
  }, [isAuthenticated, isLoading, setLocation, user, hasToken]);
  
  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Caricamento in corso...</div>;
  }
  
  // Se abbiamo un token, assumiamo che l'utente sia autenticato per il rendering iniziale
  const shouldRender = isAuthenticated || (hasToken && !isLoading);
  
  // Renderizza solo se autenticati o abbiamo un token
  return shouldRender ? <Component /> : <div className="flex items-center justify-center h-full">Reindirizzamento al login...</div>;
}

// Public routes that don't require authentication
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="*">
        <ProtectedRoutes />
      </Route>
    </Switch>
  );
}

// Protected routes that require authentication
function ProtectedRoutes() {
  // IMPORTANTE: mantenere un ordine costante degli hooks
  // Salva token in una variabile per evitare accessi multipli a localStorage
  const hasToken = !!localStorage.getItem("auth_token");
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  console.log("ProtectedRoutes root:", { isAuthenticated, isLoading, hasToken });
  
  useEffect(() => {
    if (!isLoading && !hasToken) {
      console.log("No token in ProtectedRoutes, redirecting to login");
      setLocation("/auth/login");
    }
  }, [isLoading, hasToken, setLocation]);
  
  // Se stiamo caricando o abbiamo un token, renderizziamo il layout
  if (isLoading || hasToken) {
    return (
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/contacts/:id" component={ContactDetail} />
          <Route path="/leads" component={Leads} />
          <Route path="/companies" component={Companies} />
          <Route path="/companies/:id" component={CompanyDetail} />
          <Route path="/deals" component={Deals} />
          <Route path="/deals/new" component={NewDeal} />
          <Route path="/deals/:id" component={DealDetail} />
          <Route path="/synergies" component={Synergies} />
          <Route path="/email" component={Email} />
          <Route path="/email/accounts" component={EmailAccounts} />
          <Route path="/email/accounts/add" component={EmailAccounts} />
          <Route path="/email/accounts/:id" component={EmailAccounts} />
          <Route path="/email/settings" component={EmailSettings} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/settings" component={Settings} />
          {/* Debug routes removed */}
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    );
  }
  
  // Se non siamo autenticati e non stiamo caricando, mostriamo un messaggio di caricamento
  return <div className="flex items-center justify-center h-screen">Verifica delle credenziali...</div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <CacheReset />
        <PublicRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
