import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tiptap } from '@/components/tiptap-editor';
import { EmailAccountSelector } from './EmailAccountSelector';
import { Badge } from '@/components/ui/badge';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { T } from "@/lib/i18n-utils";

const formSchema = z.object({
  accountId: z.number().min(1, "Seleziona un account di posta elettronica"),
  to: z.array(z.string()).min(1, "Inserisci almeno un destinatario"),
  cc: z.array(z.string()).optional().default([]),
  bcc: z.array(z.string()).optional().default([]),
  subject: z.string().min(1, "Inserisci un oggetto"),
  body: z.string().min(1, "Inserisci il corpo dell'email"),
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
}

export function EmailReplyComposer({
  isOpen,
  onClose,
  originalEmail,
  entityId,
  entityType
}: EmailReplyComposerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { emailAccounts, isLoading: isLoadingAccounts } = useEmailAccounts();
  const [isGeneratingAIResponse, setIsGeneratingAIResponse] = useState(false);

  // Formattazione della risposta
  const getReplySubject = (subject: string) => {
    if (!subject) return "";
    return subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  };

  const getReplyTo = (email: Email | null) => {
    if (!email) return [];
    // Rispondi all'email originale mittente
    return [email.from];
  };

  const getReplyBody = (email: Email | null) => {
    if (!email) return "";
    const fromName = email.fromName || email.from.split('@')[0];
    const date = new Date(email.date).toLocaleDateString();

    return `<p></p><p></p><hr /><p><i>${T(t, "email.originalMessage", "Messaggio originale")} - ${date}</i></p>
    <p><b>${T(t, "email.from", "Da")}: ${fromName} &lt;${email.from}&gt;</b></p>
    <p><b>${T(t, "email.subject", "Oggetto")}: ${email.subject}</b></p>
    <p><b>${T(t, "email.to", "A")}: ${email.to.join(", ")}</b></p>
    ${email.body}`;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: 0,
      to: [],
      cc: [],
      bcc: [],
      subject: "",
      body: "",
    }
  });

  useEffect(() => {
    if (originalEmail && isOpen) {
      // Imposta valori iniziali in base all'email originale
      const defaultAccountId = originalEmail.accountId || (emailAccounts.length > 0 ? emailAccounts[0].id : 0);

      form.reset({
        accountId: defaultAccountId,
        to: getReplyTo(originalEmail),
        cc: [],
        bcc: [],
        subject: getReplySubject(originalEmail.subject),
        body: getReplyBody(originalEmail),
      });
    }
  }, [originalEmail, isOpen, emailAccounts, form]);

  const sendEmailMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          entityId,
          entityType,
          inReplyTo: originalEmail?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'invio dell\'email');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: T(t, "email.sentSuccessfully", "Email inviata con successo"),
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: T(t, "email.sendError", "Errore nell'invio dell'email"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const generateAIResponse = async () => {
    if (!originalEmail) return;
    
    setIsGeneratingAIResponse(true);
    try {
      const response = await fetch('/api/ai/generate-email-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalEmail,
          entityType,
          entityId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella generazione della risposta AI');
      }

      const data = await response.json();
      
      // Ottieni il testo del corpo attuale
      const currentBody = form.getValues('body');
      
      // Inserisci la risposta generata all'inizio del corpo
      const bodyWithAIResponse = `<p>${data.generatedResponse}</p>${currentBody}`;
      
      // Aggiorna il corpo nel form
      form.setValue('body', bodyWithAIResponse, { shouldValidate: true });
      
      toast({
        title: T(t, "email.aiResponseGenerated", "Risposta AI generata"),
        description: T(t, "email.aiResponseHelp", "La risposta è stata inserita nell'editor. Puoi modificarla prima di inviare."),
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: T(t, "email.aiResponseError", "Errore nella generazione della risposta AI"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIResponse(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    sendEmailMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {T(t, "email.replyEmail", "Rispondi all'email")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <Label>{T(t, "email.fromAccount", "Dal tuo account")}</Label>
                  <FormControl>
                    <EmailAccountSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoadingAccounts || sendEmailMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <Label>{T(t, "email.to", "A")}</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {field.value.map((email, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            const newEmails = [...field.value];
                            newEmails.splice(index, 1);
                            field.onChange(newEmails);
                          }}
                        />
                      </Badge>
                    ))}
                    <Input
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder={T(t, "email.addRecipient", "Aggiungi destinatario...")}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          e.preventDefault();
                          const email = e.currentTarget.value.trim();
                          if (email && !field.value.includes(email)) {
                            field.onChange([...field.value, email]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      disabled={sendEmailMutation.isPending}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <Label>{T(t, "email.subject", "Oggetto")}</Label>
                  <FormControl>
                    <Input 
                      {...field} 
                      disabled={sendEmailMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <Label>{T(t, "email.message", "Messaggio")}</Label>
                  <div className="border rounded-md">
                    <FormControl>
                      <Tiptap
                        value={field.value}
                        onChange={(html) => field.onChange(html)}
                        editable={!sendEmailMutation.isPending}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={sendEmailMutation.isPending}
                >
                  {T(t, "common.cancel", "Annulla")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateAIResponse}
                  disabled={sendEmailMutation.isPending || isGeneratingAIResponse || !originalEmail}
                >
                  {isGeneratingAIResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {T(t, "email.generatingResponse", "Generazione risposta...")}
                    </>
                  ) : (
                    T(t, "email.generateAIResponse", "Genera risposta con AI")
                  )}
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {T(t, "email.sending", "Invio in corso...")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {T(t, "email.send", "Invia")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}