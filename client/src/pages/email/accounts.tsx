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
            Back to Accounts
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isAddRoute ? "Add Email Account" : "Edit Email Account"}
          </h1>
          
          {isAddRoute ? (
            // Add mode - show empty form
            <EmailAccountForm 
              onSuccess={() => navigate("/email/settings")} 
            />
          ) : isLoading ? (
            // Edit mode - loading
            <div>Loading account details...</div>
          ) : !account ? (
            // Edit mode - account not found
            <div>Account not found. <Button onClick={() => navigate("/email/settings")}>Go back</Button></div>
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
        <h1 className="text-2xl font-bold">Email Accounts</h1>
      </div>
      
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="accounts" className="flex-1">Accounts</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <EmailAccountList />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Email Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Synchronization</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Control how often emails are synchronized with your email accounts.
                </p>
                {/* Will implement settings form here in the future */}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Email Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create and manage email templates for quick responses.
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