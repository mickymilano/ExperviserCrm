import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailAccountList } from '@/components/email/EmailAccountList';
import { SignatureList } from '@/components/email/SignatureList';

export function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState('accounts');
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impostazioni Email</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci i tuoi account email, firme e preferenze
        </p>
      </div>
      
      <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accounts">Account Email</TabsTrigger>
          <TabsTrigger value="signatures">Firme</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="accounts" className="space-y-4">
            <EmailAccountList />
          </TabsContent>
          <TabsContent value="signatures" className="space-y-4">
            <SignatureList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default EmailSettingsPage;