import { useEffect, useState } from 'react';
import { EmailInbox } from '@/components/email/EmailInbox';
import { useTranslation } from 'react-i18next';

export function EmailInboxPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({});

  useEffect(() => {
    // Aggiorniamo il titolo della pagina
    document.title = `${t('email.inbox')} | Experviser CRM`;
  }, [t]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('email.inbox')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('email.inboxDescription')}
        </p>
      </div>
      
      <EmailInbox filter={filter} />
    </div>
  );
}

export default EmailInboxPage;