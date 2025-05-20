import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, RefreshCw, Send, Inbox, ArchiveX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface EntityEmailInboxProps {
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'branch';
  entityId: number;
}

export default function EntityEmailInbox({ entityType, entityId }: EntityEmailInboxProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch emails for this entity
  const {
    data: emails = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/emails/${entityType}/${entityId}`, activeTab],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/emails/${entityType}/${entityId}?folder=${activeTab}`);
        return response || [];
      } catch (error) {
        console.error('Error fetching emails:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Handle sync emails
  const handleSync = async () => {
    try {
      await apiRequest('POST', `/api/emails/${entityType}/${entityId}/sync`);
      toast({
        title: t('email.syncSuccess', 'Sincronizzazione completata'),
        description: t('email.syncSuccessDesc', 'Le email sono state sincronizzate con successo'),
      });
      refetch();
    } catch (error) {
      toast({
        title: t('email.syncError', 'Errore sincronizzazione'),
        description: t('email.syncErrorDesc', 'Si è verificato un errore durante la sincronizzazione delle email'),
        variant: 'destructive',
      });
    }
  };

  // Filter emails based on search query
  const filteredEmails = searchQuery
    ? emails.filter((email: any) =>
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            {t('email.errorTitle', 'Errore caricamento email')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {t('email.errorDesc', 'Si è verificato un errore durante il caricamento delle email. Riprova più tardi.')}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry', 'Riprova')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            {t('email.title', 'Email')}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('email.sync', 'Sincronizza')}
            </Button>
            <Button size="sm">
              <Send className="mr-2 h-4 w-4" />
              {t('email.compose', 'Scrivi email')}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Input
            placeholder={t('email.search', 'Cerca nelle email...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="inbox" className="flex items-center">
              <Inbox className="mr-2 h-4 w-4" />
              {t('email.inbox', 'Posta in arrivo')}
              {emails.filter((email: any) => !email.isRead && email.folder === 'inbox').length > 0 && (
                <Badge className="ml-2 bg-red-500">
                  {emails.filter((email: any) => !email.isRead && email.folder === 'inbox').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <Send className="mr-2 h-4 w-4" />
              {t('email.sent', 'Inviati')}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center">
              <ArchiveX className="mr-2 h-4 w-4" />
              {t('email.archived', 'Archiviati')}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              {t('email.scheduled', 'Programmati')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-12 w-full" />
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            ) : filteredEmails.length === 0 ? (
              // Empty state
              <div className="text-center py-10">
                <Mail className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium">
                  {activeTab === 'inbox'
                    ? t('email.noInbox', 'Nessuna email in arrivo')
                    : activeTab === 'sent'
                    ? t('email.noSent', 'Nessuna email inviata')
                    : activeTab === 'archived'
                    ? t('email.noArchived', 'Nessuna email archiviata')
                    : t('email.noScheduled', 'Nessuna email programmata')}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? t('email.noSearchResults', 'Nessun risultato trovato per la ricerca')
                    : t('email.checkLater', 'Controlla più tardi o sincronizza le email')}
                </p>
              </div>
            ) : (
              // Email list
              <div className="space-y-4">
                {filteredEmails.map((email: any) => (
                  <div key={email.id} className="border rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                    <div className="flex justify-between">
                      <h3 className={`font-medium ${!email.isRead ? 'font-bold' : ''}`}>{email.subject || t('email.noSubject', '(Nessun oggetto)')}</h3>
                      <span className="text-sm text-gray-500">{new Date(email.receivedAt || email.sentAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mt-1">
                      {activeTab === 'sent' ? t('email.to', 'A:') : t('email.from', 'Da:')} {email.from || email.to}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {email.text || email.html}
                    </div>
                    {!email.isRead && <Badge className="mt-2 bg-blue-500">{t('email.unread', 'Non letto')}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}