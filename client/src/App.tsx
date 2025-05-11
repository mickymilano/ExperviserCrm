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
import Email from "@/pages/email";
import EmailAccounts from "@/pages/email/accounts";
import EmailSettings from "@/pages/email/settings";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/auth/login";
// Debug imports removed
import { useAuth } from "@/hooks/useAuth";

// Protected route component
function ProtectedRoute({ component: Component }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  console.log("Protected route auth status:", { 
    isAuthenticated, 
    isLoading, 
    userExists: !!user, 
    token: !!localStorage.getItem("auth_token") 
  });
  
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    
    if (!isLoading && !token) {
      console.log("No token found, redirecting to login");
      setLocation("/auth/login");
      return;
    }
    
    // Only redirect if we're sure there's no valid token AND user data couldn't be loaded
    if (!isLoading && !isAuthenticated && !user) {
      console.log("Not authenticated and no user data, redirecting to login");
      setLocation("/auth/login");
    }
  }, [isAuthenticated, isLoading, setLocation, user]);
  
  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Caricamento in corso...</div>;
  }
  
  // If we have a token, we'll assume the user is authenticated for initial rendering
  const token = localStorage.getItem("auth_token");
  const shouldRender = isAuthenticated || (!!token && !isLoading);
  
  // Only render the component if authenticated or we have a token
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
  // Simple authentication check for the whole layout rather than each route
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem("auth_token");
  
  console.log("ProtectedRoutes root:", { isAuthenticated, isLoading, hasToken: !!token });
  
  useEffect(() => {
    if (!isLoading && !token) {
      console.log("No token in ProtectedRoutes, redirecting to login");
      setLocation("/auth/login");
    }
  }, [isLoading, token, setLocation]);
  
  // If loading or we have a token, render the layout
  if (isLoading || token) {
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
          <Route path="/deals/:id" component={DealDetail} />
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
  
  // If not authenticated and not loading, show loading message
  return <div className="flex items-center justify-center h-screen">Verifica delle credenziali...</div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PublicRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
