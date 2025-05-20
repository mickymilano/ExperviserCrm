import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertCircle, Check, Code, Database, RefreshCw } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '../../components/layouts/SettingsLayout';

// Interfaccia per lo stato della configurazione Notion
interface NotionConfigStatus {
  configured: boolean;
  message: string;
  hasIntegrationSecret: boolean;
  hasPageUrl: boolean;
}

export default function NotionIntegrationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);

  // Query per ottenere lo stato della configurazione Notion
  const { data: configStatus, isLoading, error, refetch } = useQuery<NotionConfigStatus>({
    queryKey: ['/api/notion/status'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Mutation per inizializzare i database Notion
  const setupMutation = useMutation({
    mutationFn: async () => {
      setIsSettingUp(true);
      const response = await fetch('/api/notion/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'inizializzazione dei database Notion');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.notion.setupSuccess'),
        description: t('settings.notion.setupSuccessDescription'),
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.notion.setupError'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSettingUp(false);
    },
  });

  // Mutation per creare dati di esempio
  const sampleDataMutation = useMutation({
    mutationFn: async () => {
      setIsCreatingSampleData(true);
      const response = await fetch('/api/notion/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante la creazione dei dati di esempio');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.notion.sampleDataSuccess'),
        description: t('settings.notion.sampleDataSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.notion.sampleDataError'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCreatingSampleData(false);
    },
  });

  return (
    <SettingsLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('settings.notion.title')}</h1>
          <p className="text-muted-foreground">{t('settings.notion.description')}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Card di stato configurazione */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notion.statusTitle')}</CardTitle>
              <CardDescription>{t('settings.notion.statusDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t('common.loading')}</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('common.error')}</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error ? error.message : t('common.unknownError')}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('settings.notion.integrationSecret')}</span>
                      {configStatus?.hasIntegrationSecret ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {t('common.configured')}
                        </span>
                      ) : (
                        <span className="text-destructive">{t('common.notConfigured')}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('settings.notion.pageUrl')}</span>
                      {configStatus?.hasPageUrl ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {t('common.configured')}
                        </span>
                      ) : (
                        <span className="text-destructive">{t('common.notConfigured')}</span>
                      )}
                    </div>

                    <Separator />

                    <div className="pt-2">
                      <Alert variant={configStatus?.configured ? "default" : "destructive"}>
                        <AlertTitle>{t('settings.notion.configStatusTitle')}</AlertTitle>
                        <AlertDescription>
                          {configStatus?.message}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
              <Button
                disabled={!configStatus?.configured}
                onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
              >
                <Code className="h-4 w-4 mr-2" />
                {t('settings.notion.openIntegrations')}
              </Button>
            </CardFooter>
          </Card>

          {/* Card di configurazione database */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notion.setupTitle')}</CardTitle>
              <CardDescription>{t('settings.notion.setupDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {t('settings.notion.setupInfo')}
              </p>
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle>{t('settings.notion.createdDatabases')}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2">
                      <li>{t('settings.notion.contactsDb')}</li>
                      <li>{t('settings.notion.companiesDb')}</li>
                      <li>{t('settings.notion.dealsDb')}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                disabled={!configStatus?.configured || isSettingUp}
                onClick={() => sampleDataMutation.mutate()}
              >
                {isCreatingSampleData ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {t('settings.notion.createSampleData')}
              </Button>
              <Button
                disabled={!configStatus?.configured || isSettingUp}
                onClick={() => setupMutation.mutate()}
              >
                {isSettingUp ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                {t('settings.notion.setupDatabases')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}