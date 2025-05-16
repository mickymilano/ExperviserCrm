import { EmailAccountList } from "@/components/email/EmailAccountList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useLocation } from "wouter";
import { useEmailAccount } from "@/hooks/useEmailAccounts";
import { EmailAccountForm } from "@/components/email/EmailAccountForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EmailAccounts() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const isAddRoute = location === "/email/accounts/add";
  const accountId = params?.id && !isAddRoute ? parseInt(params.id) : null;
  
  const { data: account, isLoading } = useEmailAccount(accountId);

  // If we are on the add route or have an account ID in the URL, show the form
  if (isAddRoute || accountId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/email/settings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Account
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isAddRoute ? "Aggiungi Account Email" : "Modifica Account Email"}
          </h1>
          
          {isAddRoute ? (
            // Add mode - show empty form
            <EmailAccountForm 
              onSuccess={() => navigate("/email/settings")} 
            />
          ) : isLoading ? (
            // Edit mode - loading
            <div>Caricamento dettagli account...</div>
          ) : !account ? (
            // Edit mode - account not found
            <div>Account non trovato. <Button onClick={() => navigate("/email/settings")}>Torna indietro</Button></div>
          ) : (
            // Edit mode - show form with account data
            <EmailAccountForm 
              account={account} 
              onSuccess={() => navigate("/email/settings")} 
            />
          )}
        </div>
      </div>
    );
  }

  // Otherwise show the regular accounts page
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Email</h1>
      </div>
      
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="accounts" className="flex-1">Account</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Impostazioni</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <EmailAccountList />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Impostazioni Email</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Sincronizzazione</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Controlla la frequenza con cui le email vengono sincronizzate con i tuoi account.
                </p>
                {/* Will implement settings form here in the future */}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Modelli Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea e gestisci modelli email per risposte rapide.
                </p>
                {/* Will implement template management here in the future */}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}