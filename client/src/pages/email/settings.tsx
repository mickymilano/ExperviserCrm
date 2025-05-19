import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailAccountList } from '@/components/email/EmailAccountList';
import { SignatureList } from '@/components/email/SignatureList';
import { useTranslation } from 'react-i18next';

export function EmailSettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('accounts');
  
  useEffect(() => {
    // Aggiorniamo il titolo della pagina
    document.title = `${t('email.settings')} | Experviser CRM`;
  }, [t]);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('email.settings')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('email.settingsDescription')}
        </p>
      </div>
      
      <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accounts">{t('email.accounts')}</TabsTrigger>
          <TabsTrigger value="signatures">{t('email.signatures')}</TabsTrigger>
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