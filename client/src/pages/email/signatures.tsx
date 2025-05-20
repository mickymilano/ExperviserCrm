import { useEffect } from 'react';
import { SignatureList } from '../../components/email/SignatureList';
import { useTranslation } from 'react-i18next';

export function EmailSignaturesPage() {
  const { t } = useTranslation();

  useEffect(() => {
    // Aggiorniamo il titolo della pagina
    document.title = `${t('email.signatures')} | Experviser CRM`;
  }, [t]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('email.signatures')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('email.signaturesDescription')}
        </p>
      </div>

      <SignatureList />
    </div>
  );
}

export default EmailSignaturesPage;