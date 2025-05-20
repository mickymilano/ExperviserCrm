import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface ContactOption {
  value: string;
  label: string;
}

interface NewEmailComposerProps {
  onSent: () => void;
  onCancel: () => void;
  defaultTo?: string[];
  defaultCc?: string[];
  defaultBcc?: string[];
  defaultSubject?: string;
  defaultContent?: string;
  filter?: {
    contactId?: number;
    companyId?: number;
    dealId?: number;
    leadId?: number;
    branchId?: number;
  };
}

const emailSchema = z.object({
  to: z.array(z.string()).min(1, 'Destinatario richiesto'),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string().min(1, 'Oggetto richiesto'),
  content: z.string().min(1, 'Contenuto richiesto'),
  accountId: z.string().min(1, 'Account email richiesto'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export function NewEmailComposer({
  onSent,
  onCancel,
  defaultTo = [],
  defaultCc = [],
  defaultBcc = [],
  defaultSubject = '',
  defaultContent = '',
  filter,
}: NewEmailComposerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [contactOptions, setContactOptions] = useState<ContactOption[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(defaultTo);
  const [selectedCc, setSelectedCc] = useState<string[]>(defaultCc);
  const [selectedBcc, setSelectedBcc] = useState<string[]>(defaultBcc);

  // Recupera gli account email
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: () => apiRequest({ url: '/api/email/accounts' }),
  });

  // Recupera i contatti per l'autocompletamento
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiRequest({ url: '/api/contacts' }),
  });

  // Inizializza il form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: defaultTo,
      cc: defaultCc,
      bcc: defaultBcc,
      subject: defaultSubject,
      content: defaultContent,
      accountId: '',
    },
  });

  // Prepara le opzioni per il dropdown dei contatti
  useEffect(() => {
    if (contacts && Array.isArray(contacts)) {
      const options = contacts.map((contact: any) => ({
        value: contact.email,
        label: `${contact.firstName} ${contact.lastName} (${contact.email})`,
      }));
      setContactOptions(options);
    }
  }, [contacts]);

  // Prepara gli elementi per la relazione con le entità (contatto, azienda, deal, ecc.)
  useEffect(() => {
    if (filter) {
      const entityRelations = [];
      if (filter.contactId) entityRelations.push({ entityType: 'contact', entityId: filter.contactId });
      if (filter.companyId) entityRelations.push({ entityType: 'company', entityId: filter.companyId });
      if (filter.dealId) entityRelations.push({ entityType: 'deal', entityId: filter.dealId });
      if (filter.leadId) entityRelations.push({ entityType: 'lead', entityId: filter.leadId });
      if (filter.branchId) entityRelations.push({ entityType: 'branch', entityId: filter.branchId });
      
      // Salva le relazioni nel form
      form.setValue('entityRelations', entityRelations);
    }
  }, [filter, form]);

  // Imposta l'account primario come default
  useEffect(() => {
    if (accounts && Array.isArray(accounts) && accounts.length > 0) {
      const primaryAccount = accounts.find((account: any) => account.is_primary);
      form.setValue('accountId', (primaryAccount || accounts[0]).id.toString());
    }
  }, [accounts, form]);

  // Invia l'email
  const onSubmit = async (data: EmailFormValues) => {
    setIsSending(true);
    
    try {
      // Prepara i dati per l'invio
      const emailData = {
        accountId: parseInt(data.accountId),
        to: data.to,
        cc: data.cc || [],
        bcc: data.bcc || [],
        subject: data.subject,
        text: data.content,
        html: data.content.replace(/\n/g, '<br>'),
        entityRelations: form.getValues('entityRelations') || [],
      };
      
      // Invia la richiesta all'API
      await apiRequest({
        url: '/api/email/send',
        method: 'POST',
        data: emailData,
      });
      
      toast({
        title: t('Email inviata'),
        description: t('La tua email è stata inviata con successo'),
      });
      
      onSent();
    } catch (error) {
      console.error('Errore invio email:', error);
      toast({
        title: t('Errore invio email'),
        description: t('Non è stato possibile inviare l\'email'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Gestisce i destinatari selezionati
  const handleToChange = (emails: string[]) => {
    setSelectedContacts(emails);
    form.setValue('to', emails, { shouldValidate: true });
  };

  // Gestisce i destinatari in CC
  const handleCcChange = (emails: string[]) => {
    setSelectedCc(emails);
    form.setValue('cc', emails, { shouldValidate: true });
  };

  // Gestisce i destinatari in BCC
  const handleBccChange = (emails: string[]) => {
    setSelectedBcc(emails);
    form.setValue('bcc', emails, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Account mittente')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value.toString()}
                disabled={isLoadingAccounts || !accounts || accounts.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Seleziona account')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts && Array.isArray(accounts) && accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.display_name} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('A')}</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                  {selectedContacts.map((email) => {
                    const contact = contactOptions.find((c) => c.value === email);
                    return (
                      <div 
                        key={email} 
                        className="bg-primary/10 px-2 py-1 rounded-md flex items-center"
                      >
                        <span>{contact ? contact.label : email}</span>
                        <button
                          type="button"
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => handleToChange(selectedContacts.filter(e => e !== email))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <input
                    className="flex-1 min-w-[100px] outline-none border-none"
                    placeholder={t('Inserisci indirizzo email...')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const email = e.currentTarget.value.trim();
                        if (email && !selectedContacts.includes(email)) {
                          handleToChange([...selectedContacts, email]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('CC')}</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                  {selectedCc.map((email) => {
                    const contact = contactOptions.find((c) => c.value === email);
                    return (
                      <div 
                        key={email} 
                        className="bg-primary/10 px-2 py-1 rounded-md flex items-center"
                      >
                        <span>{contact ? contact.label : email}</span>
                        <button
                          type="button"
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => handleCcChange(selectedCc.filter(e => e !== email))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <input
                    className="flex-1 min-w-[100px] outline-none border-none"
                    placeholder={t('Inserisci indirizzo email...')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const email = e.currentTarget.value.trim();
                        if (email && !selectedCc.includes(email)) {
                          handleCcChange([...selectedCc, email]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bcc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('BCC')}</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                  {selectedBcc.map((email) => {
                    const contact = contactOptions.find((c) => c.value === email);
                    return (
                      <div 
                        key={email} 
                        className="bg-primary/10 px-2 py-1 rounded-md flex items-center"
                      >
                        <span>{contact ? contact.label : email}</span>
                        <button
                          type="button"
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => handleBccChange(selectedBcc.filter(e => e !== email))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <input
                    className="flex-1 min-w-[100px] outline-none border-none"
                    placeholder={t('Inserisci indirizzo email...')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const email = e.currentTarget.value.trim();
                        if (email && !selectedBcc.includes(email)) {
                          handleBccChange([...selectedBcc, email]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Oggetto')}</FormLabel>
              <FormControl>
                <Input placeholder={t('Inserisci oggetto')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Contenuto')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('Scrivi il contenuto dell\'email')} 
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            {t('Annulla')}
          </Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? t('Invio in corso...') : t('Invia')}
          </Button>
        </div>
      </form>
    </Form>
  );
}