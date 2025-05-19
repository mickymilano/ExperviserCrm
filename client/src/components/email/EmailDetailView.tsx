import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ArrowLeft, Download, Forward, Reply, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { NewEmailComposer } from './NewEmailComposer';

interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  id: string;
}

interface DetailedEmail {
  id: number;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string;
  text: string;
  html?: string;
  hasAttachments: boolean;
  attachments?: Attachment[];
  account_id: number;
  account_email: string;
  account_display_name: string;
}

interface EmailDetailViewProps {
  email: DetailedEmail;
  onReply: () => void;
  onBack: () => void;
  filter?: {
    contactId?: number;
    companyId?: number;
    dealId?: number;
    leadId?: number;
    branchId?: number;
  };
}

export function EmailDetailView({ email, onReply, onBack, filter }: EmailDetailViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  
  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      // Richiesta per ottenere il blob dell'allegato
      const response = await fetch(`/api/email/messages/${email.id}/attachment/${attachmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Errore nel download dell\'allegato');
      }
      
      // Crea un URL per il blob e avvia il download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: t('Download completato'),
        description: t('Allegato scaricato con successo'),
      });
    } catch (error) {
      console.error('Errore download allegato:', error);
      toast({
        title: t('Errore download'),
        description: t('Impossibile scaricare l\'allegato'),
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteEmail = async () => {
    if (!confirm(t('Sei sicuro di voler eliminare questa email?'))) {
      return;
    }
    
    try {
      await apiRequest({
        url: `/api/email/messages/${email.id}`,
        method: 'DELETE',
      });
      
      toast({
        title: t('Email eliminata'),
        description: t('Email spostata nel cestino'),
      });
      
      onBack();
    } catch (error) {
      console.error('Errore eliminazione email:', error);
      toast({
        title: t('Errore eliminazione'),
        description: t('Impossibile eliminare l\'email'),
        variant: 'destructive',
      });
    }
  };
  
  if (isReplying || isForwarding) {
    const defaultTo = isReplying ? [email.from] : [];
    const subject = isReplying 
      ? `Re: ${email.subject}`
      : `Fwd: ${email.subject}`;
    
    const quoteText = `\n\n--------------------\n${t('Da')}: ${email.from}\n${t('Data')}: ${new Date(email.date).toLocaleString()}\n${t('Oggetto')}: ${email.subject}\n\n${email.text}`;
    
    return (
      <Card className="w-full p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" className="mr-2" onClick={() => {
            setIsReplying(false);
            setIsForwarding(false);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Indietro')}
          </Button>
          <h2 className="text-xl font-semibold">
            {isReplying ? t('Rispondi') : t('Inoltra')}
          </h2>
        </div>
        
        <NewEmailComposer
          onSent={() => {
            setIsReplying(false);
            setIsForwarding(false);
            onBack();
          }}
          onCancel={() => {
            setIsReplying(false);
            setIsForwarding(false);
          }}
          defaultTo={defaultTo}
          defaultSubject={subject}
          defaultContent={quoteText}
          filter={filter}
        />
      </Card>
    );
  }
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4">
        <Button variant="ghost" className="mr-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Indietro')}
        </Button>
        <div className="flex-1" />
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsReplying(true)}>
            <Reply className="h-4 w-4 mr-2" />
            {t('Rispondi')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsForwarding(true)}>
            <Forward className="h-4 w-4 mr-2" />
            {t('Inoltra')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteEmail}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('Elimina')}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold mb-4">{email.subject || t('(Nessun oggetto)')}</h1>
        
        <div className="flex items-start mb-4">
          <Avatar className="mr-4">
            <div className="bg-primary text-white flex items-center justify-center w-full h-full text-xl uppercase">
              {email.from.charAt(0)}
            </div>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">{email.from}</h2>
                <p className="text-sm text-gray-500">
                  {t('A')}: {email.to.join(', ')}
                </p>
                {email.cc && email.cc.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {t('CC')}: {email.cc.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1 md:mt-0">
                {new Date(email.date).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {email.attachments && email.attachments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">{t('Allegati')}:</h3>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <Badge
                  key={attachment.id}
                  variant="outline"
                  className="flex items-center cursor-pointer hover:bg-muted"
                  onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {attachment.filename}
                  <span className="ml-1 text-xs text-gray-500">
                    ({(attachment.size / 1024).toFixed(0)} KB)
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Separator className="my-4" />
        
        {email.html ? (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: email.html }}
          />
        ) : (
          <div className="whitespace-pre-wrap">{email.text}</div>
        )}
      </div>
    </div>
  );
}