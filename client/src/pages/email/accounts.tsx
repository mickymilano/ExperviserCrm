import { useEffect } from 'react';
import { EmailAccountList } from '@/components/email/EmailAccountList';
import { useTranslation } from 'react-i18next';

export function EmailAccountsPage() {
  const { t } = useTranslation();

  useEffect(() => {
    // Aggiorniamo il titolo della pagina
    document.title = `${t('email.accounts')} | Experviser CRM`;
  }, [t]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('email.accounts')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('email.accountsDescription')}
        </p>
      </div>

      <EmailAccountList />
    </div>
  );
}

export default EmailAccountsPage;