import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Mail, Reply, Trash, Eye, Check, Filter, RefreshCw, Download, FilePlus,
  MoreHorizontal, Star, Sparkles, Clock, Loader2, Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { T } from '@/lib/translationHelper';
import { EmailReplyComposer } from './EmailReplyComposer';
import { apiRequest } from '@/lib/queryClient';

// Definizione delle proprietà
interface EntityEmailInboxProps {
  entityId: number;
  entityType: EntityType;
  entityEmail?: string;
}

// Tipi di entità supportati
export type EntityType = 'contact' | 'company' | 'branch' | 'deal' | 'lead';

// Interfaccia per le email
interface Email {
  id: number;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
  accountId: number;
  accountInfo?: {
    id: number;
    name: string;
  };
}

// Opzioni di filtro per le email
interface EmailFilterOptions {
  read?: boolean;
  unread?: boolean;
  hasAttachments?: boolean;
  sentByMe?: boolean;
  receivedByMe?: boolean;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}

export function EntityEmailInbox({ entityId, entityType, entityEmail }: EntityEmailInboxProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stati locali
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isViewEmailOpen, setIsViewEmailOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<EmailFilterOptions>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Query per ottenere le email dell'entità
  const { 
    data: emails = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/email', entityType, entityId, filterOptions],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('entityId', entityId.toString());
      queryParams.append('entityType', entityType);
      
      if (filterOptions.read !== undefined) queryParams.append('read', filterOptions.read.toString());
      if (filterOptions.unread !== undefined) queryParams.append('unread', filterOptions.unread.toString());
      if (filterOptions.hasAttachments !== undefined) queryParams.append('hasAttachments', filterOptions.hasAttachments.toString());
      if (filterOptions.sentByMe !== undefined) queryParams.append('sentByMe', filterOptions.sentByMe.toString());
      if (filterOptions.receivedByMe !== undefined) queryParams.append('receivedByMe', filterOptions.receivedByMe.toString());
      if (filterOptions.dateFrom) queryParams.append('dateFrom', filterOptions.dateFrom);
      if (filterOptions.dateTo) queryParams.append('dateTo', filterOptions.dateTo);
      if (filterOptions.searchText) queryParams.append('searchText', filterOptions.searchText);

      const response = await fetch(`/api/email?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    },
    enabled: !!entityId,
    staleTime: 1000 * 60 * 5, // 5 minuti
  });

  // Aggiornamento per gli stati di selezione quando cambiano le email
  useEffect(() => {
    if (emails.length === 0) {
      setSelectedEmails([]);
      setSelectedEmail(null);
    } else if (selectedEmail && !emails.find((email: Email) => email.id === selectedEmail.id)) {
      setSelectedEmail(null);
    }
  }, [emails, selectedEmail]);

  // Mutation per segnare le email come lette
  const markAsReadMutation = useMutation({
    mutationFn: async (emailIds: number[]) => {
      return await apiRequest('/api/email/mark-read', {
        method: 'POST',
        body: JSON.stringify({ emailIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: T(t, 'email.markedAsRead', 'Email segnata come letta'),
        description: T(t, 'email.markedAsReadDescription', 'Le email selezionate sono state segnate come lette.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: T(t, 'email.markAsReadError', 'Errore'),
        description: error.message || T(t, 'email.markAsReadErrorDescription', 'Si è verificato un errore durante la segnalazione delle email come lette.'),
        variant: 'destructive',
      });
    },
  });

  // Mutation per eliminare le email
  const deleteEmailsMutation = useMutation({
    mutationFn: async (emailIds: number[]) => {
      return await apiRequest('/api/email/delete', {
        method: 'POST',
        body: JSON.stringify({ emailIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      setSelectedEmails([]);
      toast({
        title: T(t, 'email.deleted', 'Email eliminate'),
        description: T(t, 'email.deletedDescription', 'Le email selezionate sono state eliminate.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: T(t, 'email.deleteError', 'Errore'),
        description: error.message || T(t, 'email.deleteErrorDescription', 'Si è verificato un errore durante l\'eliminazione delle email.'),
        variant: 'destructive',
      });
    },
  });

  // Funzione per aggiornare i dati
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: T(t, 'email.refreshed', 'Dati aggiornati'),
        description: T(t, 'email.refreshedDescription', 'L\'elenco delle email è stato aggiornato.'),
      });
    } catch (error) {
      toast({
        title: T(t, 'email.refreshError', 'Errore'),
        description: T(t, 'email.refreshErrorDescription', 'Si è verificato un errore durante l\'aggiornamento delle email.'),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gestore per la selezione di tutte le email
  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  // Gestore per visualizzare una email
  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    setIsViewEmailOpen(true);
    
    // Se l'email non è stata ancora letta, segnarla come letta
    if (!email.read) {
      markAsReadMutation.mutate([email.id]);
    }
  };

  // Gestore per la risposta a una email
  const handleReplyEmail = (email: Email) => {
    setSelectedEmail(email);
    setIsReplyOpen(true);
  };

  // Componente per visualizzare i dettagli di una email
  const EmailViewDialog = ({ email }: { email: Email }) => {
    if (!email) return null;

    return (
      <Dialog open={isViewEmailOpen} onOpenChange={setIsViewEmailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{email.subject}</DialogTitle>
            <DialogDescription className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{T(t, 'email.from', 'Da')}:</span> {email.fromName || email.from}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{T(t, 'email.to', 'A')}:</span> {email.to.join(', ')}
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{T(t, 'email.cc', 'CC')}:</span> {email.cc.join(', ')}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{T(t, 'email.date', 'Data')}:</span> {format(new Date(email.date), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleReplyEmail(email)}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {T(t, 'email.reply', 'Rispondi')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteEmailsMutation.mutate([email.id])}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {T(t, 'email.delete', 'Elimina')}
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <div 
            className="prose prose-sm max-w-none mt-2" 
            dangerouslySetInnerHTML={{ __html: email.body }} 
          />

          {email.hasAttachments && (
            <div className="mt-4 border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">{T(t, 'email.attachments', 'Allegati')}</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {T(t, 'email.downloadAll', 'Scarica tutti')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Componente per il dialogo di filtro
  const FilterDialog = () => {
    const [localFilters, setLocalFilters] = useState<EmailFilterOptions>({...filterOptions});

    const applyFilters = () => {
      setFilterOptions(localFilters);
      setIsFilterOpen(false);
    };

    const resetFilters = () => {
      setLocalFilters({});
    };

    return (
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{T(t, 'email.filterEmails', 'Filtra Email')}</DialogTitle>
            <DialogDescription>
              {T(t, 'email.filterEmailsDescription', 'Applica filtri per trovare le email che stai cercando.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{T(t, 'email.filterByStatus', 'Filtra per stato')}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-read"
                    checked={!!localFilters.read}
                    onCheckedChange={(checked) => setLocalFilters({...localFilters, read: !!checked})}
                  />
                  <label htmlFor="filter-read" className="text-sm">{T(t, 'email.read', 'Lette')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-unread"
                    checked={!!localFilters.unread}
                    onCheckedChange={(checked) => setLocalFilters({...localFilters, unread: !!checked})}
                  />
                  <label htmlFor="filter-unread" className="text-sm">{T(t, 'email.unread', 'Non lette')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-attachments"
                    checked={!!localFilters.hasAttachments}
                    onCheckedChange={(checked) => setLocalFilters({...localFilters, hasAttachments: !!checked})}
                  />
                  <label htmlFor="filter-attachments" className="text-sm">{T(t, 'email.withAttachments', 'Con allegati')}</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{T(t, 'email.filterByDirection', 'Filtra per direzione')}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-sent"
                    checked={!!localFilters.sentByMe}
                    onCheckedChange={(checked) => setLocalFilters({...localFilters, sentByMe: !!checked})}
                  />
                  <label htmlFor="filter-sent" className="text-sm">{T(t, 'email.sent', 'Inviate')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-received"
                    checked={!!localFilters.receivedByMe}
                    onCheckedChange={(checked) => setLocalFilters({...localFilters, receivedByMe: !!checked})}
                  />
                  <label htmlFor="filter-received" className="text-sm">{T(t, 'email.received', 'Ricevute')}</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{T(t, 'email.filterByDate', 'Filtra per data')}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm">{T(t, 'email.dateFrom', 'Data inizio')}</label>
                  <Input 
                    type="date" 
                    value={localFilters.dateFrom || ''}
                    onChange={(e) => setLocalFilters({...localFilters, dateFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">{T(t, 'email.dateTo', 'Data fine')}</label>
                  <Input 
                    type="date" 
                    value={localFilters.dateTo || ''}
                    onChange={(e) => setLocalFilters({...localFilters, dateTo: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{T(t, 'email.filterByText', 'Cerca nel testo')}</h4>
              <Input 
                type="text" 
                placeholder={T(t, 'email.searchIn', 'Cerca in mittente, oggetto e corpo')}
                value={localFilters.searchText || ''}
                onChange={(e) => setLocalFilters({...localFilters, searchText: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
            >
              {T(t, 'email.resetFilters', 'Reimposta filtri')}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFilterOpen(false)}
              >
                {T(t, 'common.cancel', 'Annulla')}
              </Button>
              <Button
                type="button"
                onClick={applyFilters}
              >
                {T(t, 'email.applyFilters', 'Applica filtri')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Funzione per renderizzare una anteprima di email nella lista
  const renderEmailItem = (email: Email) => {
    const isSelected = selectedEmails.includes(email.id);
    const formattedDate = format(new Date(email.date), 'dd/MM/yyyy HH:mm');
    
    return (
      <div 
        key={email.id}
        className={`
          flex items-start gap-2 p-3 cursor-pointer border-b hover:bg-muted/50 transition-colors 
          ${!email.read ? 'bg-primary/5 font-medium' : ''}
          ${isSelected ? 'bg-primary/10' : ''}
        `}
        onClick={(e) => {
          if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
            return; // Non fare nulla se il click è sul checkbox
          }
          handleViewEmail(email);
        }}
      >
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedEmails(prev => [...prev, email.id]);
              } else {
                setSelectedEmails(prev => prev.filter(id => id !== email.id));
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {!email.read && <div className="h-2 w-2 rounded-full bg-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="truncate font-medium">
              {email.fromName || email.from}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedDate}
            </div>
          </div>
          <div className="truncate">{email.subject}</div>
          <div className="text-xs text-muted-foreground truncate mt-1">
            {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </div>

          <div className="flex gap-1 mt-1">
            {email.hasAttachments && (
              <Badge variant="outline" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {T(t, 'email.attachment', 'Allegato')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-md h-full relative">
      {/* Barra degli strumenti */}
      <div className="border-b p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={emails.length > 0 && selectedEmails.length === emails.length}
            onCheckedChange={handleSelectAll}
          />
          
          {selectedEmails.length > 0 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsReadMutation.mutate(selectedEmails)}
                disabled={markAsReadMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                {T(t, 'email.markAsRead', 'Segna come letta')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteEmailsMutation.mutate(selectedEmails)}
                disabled={deleteEmailsMutation.isPending}
              >
                <Trash className="h-4 w-4 mr-2" />
                {T(t, 'email.delete', 'Elimina')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {T(t, 'email.filter', 'Filtro')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {T(t, 'email.refresh', 'Aggiorna')}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input 
            className="w-auto max-w-[200px]"
            placeholder={T(t, 'email.search', 'Cerca email...')}
            value={filterOptions.searchText || ''}
            onChange={(e) => setFilterOptions(prev => ({...prev, searchText: e.target.value}))}
          />
        </div>
      </div>

      {/* Lista email o stato vuoto/caricamento */}
      <div className="h-[calc(100%-56px)] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col h-full items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-muted-foreground">
              {T(t, 'email.loading', 'Caricamento email...')}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col h-full items-center justify-center p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">
              {T(t, 'email.errorTitle', 'Si è verificato un errore')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {T(t, 'email.errorDescription', 'Non è stato possibile caricare le email. Riprova più tardi.')}
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {T(t, 'email.retry', 'Riprova')}
            </Button>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">
              {T(t, 'email.noEmailsTitle', 'Nessuna email trovata')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {(Object.keys(filterOptions).length > 0) 
                ? T(t, 'email.noEmailsWithFilters', 'Nessuna email corrisponde ai filtri applicati. Prova a modificare i filtri.')
                : T(t, 'email.noEmailsDescription', 'Non ci sono email associate a questa entità.')}
            </p>
            {Object.keys(filterOptions).length > 0 && (
              <Button onClick={() => setFilterOptions({})}>
                {T(t, 'email.clearFilters', 'Rimuovi filtri')}
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y">
              {emails.map(renderEmailItem)}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Dialoghi */}
      {selectedEmail && <EmailViewDialog email={selectedEmail} />}
      <FilterDialog />
      
      {isReplyOpen && selectedEmail && (
        <EmailReplyComposer
          isOpen={isReplyOpen}
          onClose={() => setIsReplyOpen(false)}
          originalEmail={selectedEmail}
          entityId={entityId}
          entityType={entityType}
          entityEmail={entityEmail}
        />
      )}
    </div>
  );
}