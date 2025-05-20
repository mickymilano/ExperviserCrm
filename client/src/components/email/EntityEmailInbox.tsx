import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import {
  Mail, Send, Reply, Trash, MailOpen, AlertCircle, 
  Download, Paperclip, Search, Filter, User, Building
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

interface Email {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  receivedAt: string;
  isRead: boolean;
  attachments: EmailAttachment[];
  starred?: boolean;
  entityId?: string;
  entityType?: 'contact' | 'company' | 'deal' | 'lead';
}

interface EntityEmailInboxProps {
  entityId: string;
  entityType: 'contact' | 'company' | 'deal' | 'lead';
  entityName: string;
  className?: string;
}

export function EntityEmailInbox({ 
  entityId, 
  entityType, 
  entityName,
  className = "" 
}: EntityEmailInboxProps) {
  const { t } = useTranslation();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [composeMode, setComposeMode] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Carica le email associate all'entità
  const { data: emails, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/email/entity/${entityType}/${entityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/email/entity/${entityType}/${entityId}`);
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle email');
      }
      return response.json();
    }
  });

  // Filtra le email in base alla tab attiva
  const filteredEmails = emails ? emails.filter((email: Email) => {
    if (activeTab === 'inbox') return !email.isRead;
    if (activeTab === 'read') return email.isRead;
    if (activeTab === 'all') return true;
    if (activeTab === 'starred') return email.starred;
    return true;
  }) : [];

  // Mutazione per contrassegnare un'email come letta
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await fetch(`/api/email/${emailId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Errore nel contrassegnare l\'email come letta');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/email/entity/${entityType}/${entityId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/unread-count'] });
    }
  });

  // Mutazione per inviare una risposta
  const sendReplyMutation = useMutation({
    mutationFn: async ({ emailId, content }: { emailId: string, content: string }) => {
      const response = await fetch(`/api/email/${emailId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        throw new Error('Errore nell\'invio della risposta');
      }
      return response.json();
    },
    onSuccess: () => {
      setReplyContent('');
      toast({
        title: t('email.replySentSuccess'),
        description: t('email.emailWillAppearSoon'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email/entity/${entityType}/${entityId}`] });
    },
    onError: (error) => {
      toast({
        title: t('email.replySentError'),
        description: String(error),
        variant: 'destructive'
      });
    }
  });

  // Mutazione per inviare una nuova email
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { to: string, subject: string, body: string, entityId: string, entityType: string }) => {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      if (!response.ok) {
        throw new Error('Errore nell\'invio dell\'email');
      }
      return response.json();
    },
    onSuccess: () => {
      setComposeMode(false);
      setNewEmail({ to: '', subject: '', body: '' });
      toast({
        title: t('email.emailSentSuccess'),
        description: t('email.emailWillAppearSoon'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email/entity/${entityType}/${entityId}`] });
    },
    onError: (error) => {
      toast({
        title: t('email.emailSentError'),
        description: String(error),
        variant: 'destructive'
      });
    }
  });

  // Marca l'email come letta quando viene selezionata
  useEffect(() => {
    if (selectedEmail && !selectedEmail.isRead) {
      markAsReadMutation.mutate(selectedEmail.id);
    }
  }, [selectedEmail]);

  // Formatta la data dell'email
  const formatEmailDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it });
    } catch (e) {
      return dateString;
    }
  };

  // Gestisce la selezione di un'email
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setComposeMode(false);
  };

  // Gestisce l'invio di una risposta
  const handleSendReply = () => {
    if (!selectedEmail || !replyContent.trim()) return;
    
    sendReplyMutation.mutate({
      emailId: selectedEmail.id,
      content: replyContent
    });
  };

  // Gestisce l'invio di una nuova email
  const handleSendEmail = () => {
    if (!newEmail.to.trim() || !newEmail.subject.trim() || !newEmail.body.trim()) {
      toast({
        title: t('email.missingFields'),
        description: t('email.fillAllRequiredFields'),
        variant: 'destructive'
      });
      return;
    }
    
    sendEmailMutation.mutate({
      to: newEmail.to,
      subject: newEmail.subject,
      body: newEmail.body,
      entityId,
      entityType
    });
  };

  // Gestisce l'avvio della composizione di una nuova email
  const handleCompose = () => {
    setComposeMode(true);
    setSelectedEmail(null);
    
    // Se è un contatto, prepopola il campo "A" con l'email del contatto
    if (entityType === 'contact' && emails && emails.length > 0) {
      const contactEmail = emails[0].toEmail;
      setNewEmail(prev => ({ ...prev, to: contactEmail }));
    }
  };

  // Icona dell'entità in base al tipo
  const EntityIcon = entityType === 'contact' ? User : Building;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Mail className="h-5 w-5 mr-2" />
          {t('email.inboxFor')} 
          <Badge variant="outline" className="ml-2 flex items-center">
            <EntityIcon className="h-3 w-3 mr-1" />
            {entityName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('email.errorLoadingEmails')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex h-[500px]">
            <div className="w-1/3 border-r pr-2">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleCompose}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('email.compose')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => refetch()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="inbox" className="text-xs">
                    {t('email.unread')}
                    {emails && (
                      <Badge variant="secondary" className="ml-1">
                        {emails.filter(e => !e.isRead).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="read" className="text-xs">
                    {t('email.read')}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    {t('email.all')}
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="text-xs">
                    {t('email.starred')}
                  </TabsTrigger>
                </TabsList>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('email.noEmailsFound')}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    {filteredEmails.map((email: Email) => (
                      <div 
                        key={email.id}
                        className={`p-2 mb-2 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-100' : ''
                        } ${!email.isRead ? 'font-semibold' : ''}`}
                        onClick={() => handleSelectEmail(email)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-sm truncate">
                            {email.fromName || email.fromEmail}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatEmailDate(email.receivedAt)}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate">
                          {email.subject || t('email.noSubject')}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {email.body.replace(/<[^>]*>/g, '').substring(0, 50)}
                          {email.body.length > 50 ? '...' : ''}
                        </div>
                        <div className="flex items-center mt-1">
                          {!email.isRead && (
                            <Badge variant="secondary" className="mr-1 h-1.5 w-1.5 rounded-full p-0" />
                          )}
                          {email.attachments.length > 0 && (
                            <Paperclip className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </Tabs>
            </div>
            
            <div className="w-2/3 pl-4">
              {composeMode ? (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <div className="mb-2">
                      <label className="text-sm font-medium">{t('email.to')}</label>
                      <input
                        type="email"
                        value={newEmail.to}
                        onChange={e => setNewEmail({...newEmail, to: e.target.value})}
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="destinatario@esempio.com"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="text-sm font-medium">{t('email.subject')}</label>
                      <input
                        type="text"
                        value={newEmail.subject}
                        onChange={e => setNewEmail({...newEmail, subject: e.target.value})}
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder={t('email.subjectPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-grow mb-4">
                    <Textarea
                      value={newEmail.body}
                      onChange={e => setNewEmail({...newEmail, body: e.target.value})}
                      placeholder={t('email.composePlaceholder')}
                      className="min-h-[250px] h-full w-full"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setComposeMode(false);
                        setNewEmail({ to: '', subject: '', body: '' });
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      onClick={handleSendEmail}
                      disabled={sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending ? (
                        <Spinner className="h-4 w-4 mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {t('email.send')}
                    </Button>
                  </div>
                </div>
              ) : selectedEmail ? (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">
                        {selectedEmail.subject || t('email.noSubject')}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatEmailDate(selectedEmail.receivedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm mb-1">
                      <span className="font-medium mr-2">{t('email.from')}:</span>
                      <span>{selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;</span>
                    </div>
                    
                    <div className="flex items-center text-sm mb-3">
                      <span className="font-medium mr-2">{t('email.to')}:</span>
                      <span>{selectedEmail.toName} &lt;{selectedEmail.toEmail}&gt;</span>
                    </div>
                    
                    {selectedEmail.attachments.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium block mb-1">
                          {t('email.attachments')} ({selectedEmail.attachments.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmail.attachments.map(attachment => (
                            <Badge 
                              key={attachment.id}
                              variant="outline"
                              className="flex items-center cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                // Logica per scaricare l'allegato
                                window.open(`/api/email/attachment/${attachment.id}`, '_blank');
                              }}
                            >
                              <Paperclip className="h-3 w-3 mr-1" />
                              {attachment.filename}
                              <Download className="h-3 w-3 ml-1 text-gray-500" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <ScrollArea className="flex-grow mb-4 border p-3 rounded">
                    {selectedEmail.bodyType === 'html' ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                        className="email-body prose max-w-none"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {selectedEmail.body}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <div className="mb-2 text-sm font-medium">
                      {t('email.reply')}:
                    </div>
                    <Textarea
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder={t('email.replyPlaceholder')}
                      className="min-h-[100px] mb-2"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || sendReplyMutation.isPending}
                      >
                        {sendReplyMutation.isPending ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <Reply className="h-4 w-4 mr-2" />
                        )}
                        {t('email.sendReply')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center flex-col text-center">
                  <Mail className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-500">
                    {t('email.selectOrComposeEmail')}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-md">
                    {t('email.emailInboxDescription')}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleCompose}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t('email.composeNewEmail')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}