import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, Send, MoreHorizontal, Loader2, Sparkles, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Tiptap } from '@/components/tiptap-editor';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { T } from '@/lib/translationHelper';
import { apiRequest } from '@/lib/queryClient';
import { EmailAccountSelector } from './EmailAccountSelector';
import { EmailSignatureDropdown } from './EmailSignatureDropdown';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';

// Schema per validare il form
const formSchema = z.object({
  to: z.string().min(1, { message: "Destinatario richiesto" }),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, { message: "Oggetto richiesto" }),
  body: z.string().min(1, { message: "Contenuto richiesto" }),
  accountId: z.number().min(1, { message: "Seleziona un account email" }),
  signatureId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

interface EmailReplyComposerProps {
  isOpen: boolean;
  onClose: () => void;
  originalEmail: Email | null;
  entityId?: number;
  entityType?: string;
  entityEmail?: string;
}

export function EmailReplyComposer({
  isOpen, 
  onClose, 
  originalEmail,
  entityId,
  entityType,
  entityEmail
}: EmailReplyComposerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const emailAccounts = useEmailAccounts();
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Query per ottenere le firme email dell'utente
  const { data: signatures = [] } = useQuery({
    queryKey: ['/api/email/signatures'],
    queryFn: async () => {
      const response = await fetch('/api/email/signatures');
      if (!response.ok) {
        throw new Error('Failed to fetch email signatures');
      }
      return response.json();
    },
    enabled: isOpen, // Carica solo quando il modal è aperto
  });

  // Prepara il valore predefinito per il form
  const getFormDefaultValues = () => {
    if (!originalEmail) {
      return {
        to: entityEmail || '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        accountId: 0,
        signatureId: 0,
      };
    }

    // Se è una risposta a un'email esistente
    const replyPrefix = 'Re: ';
    const subject = originalEmail.subject.startsWith(replyPrefix) 
      ? originalEmail.subject 
      : `${replyPrefix}${originalEmail.subject}`;

    // Crea il testo di risposta con la citazione dell'email originale
    const originalDate = new Date(originalEmail.date).toLocaleString();
    const originalSender = originalEmail.fromName || originalEmail.from;
    
    const replyBody = `
      <br/><br/>
      <p>-------- Email originale --------</p>
      <p><b>Da:</b> ${originalSender}</p>
      <p><b>Data:</b> ${originalDate}</p>
      <p><b>Oggetto:</b> ${originalEmail.subject}</p>
      <br/>
      <blockquote style="padding-left: 1em; border-left: 2px solid #ddd;">
        ${originalEmail.body}
      </blockquote>
    `;

    return {
      to: originalEmail.from,
      cc: '',
      bcc: '',
      subject,
      body: replyBody,
      accountId: originalEmail.accountId || 0,
      signatureId: 0,
    };
  };

  // Form con validazione
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getFormDefaultValues(),
  });

  // Mutation per inviare l'email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Costruisci i destinatari come array
      const toRecipients = data.to.split(',').map(email => email.trim());
      const ccRecipients = data.cc ? data.cc.split(',').map(email => email.trim()) : [];
      const bccRecipients = data.bcc ? data.bcc.split(',').map(email => email.trim()) : [];

      // Crea l'oggetto email da inviare
      const emailPayload = {
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        subject: data.subject,
        body: data.body,
        accountId: data.accountId,
        signatureId: data.signatureId || null,
        inReplyTo: originalEmail?.id || null,
        entityId,
        entityType,
      };

      return await apiRequest('POST', '/api/email/send', emailPayload);
    },
    onSuccess: () => {
      toast({
        title: T(t, 'email.sent', 'Email inviata'),
        description: T(t, 'email.sentDescription', 'La tua email è stata inviata con successo.'),
      });
      onClose();
      form.reset(); // Reset del form
    },
    onError: (error: Error) => {
      toast({
        title: T(t, 'email.sendError', 'Errore invio email'),
        description: error.message || T(t, 'email.sendErrorDescription', 'Si è verificato un errore durante l\'invio dell\'email. Riprova più tardi.'),
        variant: 'destructive',
      });
    },
  });

  // Gestore per generare una risposta con AI
  const handleGenerateAIResponse = async () => {
    if (!originalEmail || isAiGenerating) return;

    setIsAiGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/email/generate-reply', {
          emailBody: originalEmail.body,
          emailSubject: originalEmail.subject,
          entityId,
          entityType,
      });

      // Aggiorna il corpo dell'email con la risposta generata
      form.setValue('body', response.generatedReply);
      
      toast({
        title: T(t, 'email.aiResponseGenerated', 'Risposta generata'),
        description: T(t, 'email.aiResponseGeneratedDescription', 'Una risposta è stata generata con l\'assistenza dell\'AI. Modifica secondo necessità.'),
      });
    } catch (error) {
      toast({
        title: T(t, 'email.aiGenerationError', 'Errore generazione AI'),
        description: T(t, 'email.aiGenerationErrorDescription', 'Non è stato possibile generare una risposta con l\'AI. Riprova più tardi.'),
        variant: 'destructive',
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Gestione invio del form
  const onSubmit = (values: FormValues) => {
    sendEmailMutation.mutate(values);
  };

  // Il componente va impostato su una funzione di pulizia dell'HTML per la sicurezza
  const sanitizeHtml = (html: any) => {
    // In una implementazione reale, usare DOMPurify o una libreria simile
    return html;
  };

  // Gestore per l'inserimento della firma nell'editor
  const handleInsertSignature = (signatureId: number, signatureContent: string) => {
    const currentBody = form.getValues('body');
    form.setValue('body', currentBody + sanitizeHtml(signatureContent));
    form.setValue('signatureId', signatureId);
  };

  // Ricavare contenuti per l'editor dalla email originale
  const getQuotedContent = () => {
    if (!originalEmail) return '';
    
    // Estrai la prima parte dell'email (escludendo eventuali citazioni precedenti)
    const cleanContent = originalEmail.body.split('<blockquote')[0];
    return cleanContent;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {originalEmail ? 
              T(t, 'email.replyToEmail', 'Rispondi all\'email') : 
              T(t, 'email.composeEmail', 'Componi email')}
          </DialogTitle>
          <DialogDescription>
            {originalEmail ? 
              T(t, 'email.replyToEmailDescription', 'Scrivi una risposta all\'email selezionata') : 
              T(t, 'email.composeEmailDescription', 'Scrivi una nuova email')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Account email */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <EmailAccountSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={sendEmailMutation.isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {/* Destinatario */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium min-w-[60px]">{T(t, 'email.to', 'A:')}</span>
                    <FormControl>
                      <Input
                        placeholder={T(t, 'email.enterRecipients', 'Inserisci destinatari (separati da virgola)')}
                        {...field}
                        disabled={sendEmailMutation.isPending}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* CC */}
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium min-w-[60px]">{T(t, 'email.cc', 'CC:')}</span>
                    <FormControl>
                      <Input
                        placeholder={T(t, 'email.enterCc', 'Inserisci CC (separati da virgola)')}
                        {...field}
                        disabled={sendEmailMutation.isPending}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* BCC */}
            <FormField
              control={form.control}
              name="bcc"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium min-w-[60px]">{T(t, 'email.bcc', 'BCC:')}</span>
                    <FormControl>
                      <Input
                        placeholder={T(t, 'email.enterBcc', 'Inserisci BCC (separati da virgola)')}
                        {...field}
                        disabled={sendEmailMutation.isPending}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Oggetto */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium min-w-[60px]">{T(t, 'email.subject', 'Oggetto:')}</span>
                    <FormControl>
                      <Input
                        placeholder={T(t, 'email.enterSubject', 'Inserisci oggetto')}
                        {...field}
                        disabled={sendEmailMutation.isPending}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            {/* Corpo dell'email con editor rich text */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="border rounded-md overflow-hidden">
                      <Tiptap 
                        value={field.value}
                        onChange={field.onChange}
                        editable={!sendEmailMutation.isPending}
                        placeholder={T(t, 'email.composeMessage', 'Componi il tuo messaggio qui...')}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              {/* Menu per le azioni aggiuntive */}
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={sendEmailMutation.isPending || !originalEmail}
                  onClick={handleGenerateAIResponse}
                >
                  {isAiGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {T(t, 'email.generateAIResponse', 'Genera risposta AI')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sendEmailMutation.isPending}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {T(t, 'email.attachFile', 'Allega file')}
                </Button>

                {signatures.length > 0 && (
                  <EmailSignatureDropdown
                    signatures={signatures}
                    onSelectSignature={handleInsertSignature}
                    disabled={sendEmailMutation.isPending}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={sendEmailMutation.isPending}
              >
                {T(t, 'common.cancel', 'Annulla')}
              </Button>
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {T(t, 'email.sending', 'Invio in corso...')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {T(t, 'email.send', 'Invia')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}