import { useEffect } from 'react';
import { NewEmailComposer } from '@/components/email/NewEmailComposer';
import { useTranslation } from 'react-i18next';

export function EmailComposePage() {
  const { t } = useTranslation();

  useEffect(() => {
    // Aggiorniamo il titolo della pagina
    document.title = `${t('email.compose')} | Experviser CRM`;
  }, [t]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('email.compose')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('email.composeDescription')}
        </p>
      </div>

      <NewEmailComposer />
    </div>
  );
}

export default EmailComposePage;