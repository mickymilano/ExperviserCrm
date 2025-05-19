import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";

// Helper di traduzione migliorato con fallback
const T = (t: any, key: string, fallback: string) => {
  const translation = t(key, { defaultValue: fallback });
  return translation === key ? fallback : translation;
};
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Paperclip, 
  Send, 
  X, 
  Loader2, 
  Search, 
  User,
  Plus,
  UserPlus
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const formSchema = z.object({
  to: z.string().min(1, { message: "Destinatario obbligatorio" }),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, { message: "Oggetto obbligatorio" }),
  body: z.string().min(1, { message: "Corpo del messaggio obbligatorio" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Contact {
  id: number;
  fullName: string;
  email: string;
  company?: {
    name: string;
  };
}

interface ContactOption {
  id: number;
  label: string;
  value: string;
  company?: string;
}

interface NewEmailComposerProps {
  accountId: number;
  onCancel: () => void;
  onSent: () => void;
  replyToEmail?: {
    id: number;
    from: string;
    to: string[];
    subject: string;
  };
}

export default function NewEmailComposer({
  accountId,
  onCancel,
  onSent,
  replyToEmail,
}: NewEmailComposerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ccRecipients, setCcRecipients] = useState<ContactOption[]>([]);
  const [bccRecipients, setBccRecipients] = useState<ContactOption[]>([]);
  const [ccPopoverOpen, setCcPopoverOpen] = useState(false);
  const [bccPopoverOpen, setBccPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Carica i contatti dal CRM
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/contacts"],
    select: (data: any) => {
      return data.map((contact: any) => ({
        id: contact.id,
        fullName: contact.firstName && contact.lastName 
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "Contatto",
        email: contact.email,
        company: contact.company
      }));
    }
  });

  // Prepara i valori predefiniti per il form
  let defaultSubject = "";
  let defaultTo = "";
  let defaultBody = "";

  if (replyToEmail) {
    defaultSubject = `Re: ${replyToEmail.subject}`;
    defaultTo = replyToEmail.from;
    defaultBody = `\n\n---------------------------------------\n${
      replyToEmail.from
    } ha scritto:\n`;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: defaultTo,
      cc: "",
      bcc: "",
      subject: defaultSubject,
      body: defaultBody,
    },
  });

  // Aggiorna i campi CC e BCC quando vengono modificati i destinatari
  useEffect(() => {
    const ccEmails = ccRecipients.map(r => r.value).join(", ");
    form.setValue("cc", ccEmails);
  }, [ccRecipients, form]);

  useEffect(() => {
    const bccEmails = bccRecipients.map(r => r.value).join(", ");
    form.setValue("bcc", bccEmails);
  }, [bccRecipients, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues & { accountId: number; attachments?: File[] }) => {
      // SIMULAZIONE TEMPORANEA - Da sostituire con l'implementazione reale
      // In una versione di produzione, questo codice invierebbe l'email tramite API
      console.log("Simulazione invio email:", {
        to: values.to,
        cc: values.cc,
        bcc: values.bcc,
        subject: values.subject,
        body: values.body,
        accountId: values.accountId,
        attachments: values.attachments?.map(file => file.name) || []
      });
      
      // Simuliamo un ritardo per l'invio
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            id: Math.floor(Math.random() * 1000) + 1000,
            success: true,
            message: "Email inviata con successo (simulazione)"
          });
        }, 1500); // Ritardo simulato di 1.5 secondi
      });
      
      // IMPLEMENTAZIONE REALE COMMENTATA - Da riabilitare quando le API saranno pronte
      /*
      const formData = new FormData();
      formData.append("to", values.to);
      formData.append("subject", values.subject);
      formData.append("body", values.body);
      formData.append("accountId", String(values.accountId));
      
      if (values.cc) formData.append("cc", values.cc);
      if (values.bcc) formData.append("bcc", values.bcc);
      
      // Aggiungi gli allegati se presenti
      if (values.attachments) {
        values.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      // Utilizziamo il metodo fetch direttamente per FormData
      return fetch("/api/email/send", {
        method: "POST",
        body: formData,
        // La Content-Type viene impostata automaticamente con il boundary corretto
      }).then(response => {
        if (!response.ok) {
          throw new Error('Errore nell\'invio dell\'email');
        }
        return response.json();
      });
      */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/email/accounts/${accountId}/messages`],
      });
      toast({
        title: T(t, "email.sentSuccess", "Email inviata"),
        description: T(t, "email.sentSuccessDescription", "La tua email è stata inviata con successo"),
      });
      onSent();
    },
    onError: (error) => {
      toast({
        title: T(t, "email.sentError", "Errore invio"),
        description: T(t, "email.sentErrorDescription", "Non è stato possibile inviare l'email. Riprova più tardi."),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      accountId,
      attachments,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const addCcRecipient = (contact: ContactOption) => {
    if (!ccRecipients.some(r => r.id === contact.id)) {
      setCcRecipients([...ccRecipients, contact]);
    }
    setCcPopoverOpen(false);
  };

  const removeCcRecipient = (id: number) => {
    setCcRecipients(ccRecipients.filter(r => r.id !== id));
  };

  const addBccRecipient = (contact: ContactOption) => {
    if (!bccRecipients.some(r => r.id === contact.id)) {
      setBccRecipients([...bccRecipients, contact]);
    }
    setBccPopoverOpen(false);
  };

  const removeBccRecipient = (id: number) => {
    setBccRecipients(bccRecipients.filter(r => r.id !== id));
  };

  // Filtra i contatti basandosi sulla query di ricerca
  const filteredContacts = contacts?.filter((contact: Contact) => {
    if (!contact.email) return false;
    
    const fullName = contact.fullName?.toLowerCase() || "";
    const email = contact.email.toLowerCase();
    const company = contact.company?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query) || company.includes(query);
  }).map((contact: Contact) => ({
    id: contact.id,
    label: contact.fullName,
    value: contact.email,
    company: contact.company?.name
  })) || [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onCancel} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {T(t, "email.back", "Indietro")}
          </Button>
          <div>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {T(t, "email.sending", "Invio in corso...")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {T(t, "email.send", "Invia")}
                </>
              )}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{T(t, "email.to", "A")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="nome@esempio.com" />
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
                  <div className="flex items-center justify-between">
                    <FormLabel>{T(t, "email.cc", "Cc")}</FormLabel>
                    <Popover open={ccPopoverOpen} onOpenChange={setCcPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          type="button"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          {t("email.addRecipient")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="end" side="right" sideOffset={5}>
                        <Command className="w-[250px]">
                          <CommandInput 
                            placeholder={t("email.searchContacts")} 
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>{t("email.noContactsFound")}</CommandEmpty>
                            <CommandGroup>
                              {filteredContacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  onSelect={() => addCcRecipient(contact)}
                                  className="flex items-center"
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <User className="h-4 w-4" />
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm">{contact.label}</span>
                                    <span className="text-xs text-muted-foreground">{contact.value}</span>
                                    {contact.company && (
                                      <span className="text-xs text-muted-foreground">{contact.company}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Visualizzazione dei destinatari in CC */}
                  {ccRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ccRecipients.map(recipient => (
                        <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1">
                          {recipient.label}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeCcRecipient(recipient.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Rimuovi</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <FormControl>
                    <Input {...field} placeholder="nome@esempio.com" />
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
                  <div className="flex items-center justify-between">
                    <FormLabel>{T(t, "email.bcc", "Ccn")}</FormLabel>
                    <Popover open={bccPopoverOpen} onOpenChange={setBccPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          type="button"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          {t("email.addRecipient")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="end" side="right" sideOffset={5}>
                        <Command className="w-[250px]">
                          <CommandInput 
                            placeholder={t("email.searchContacts")} 
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>{t("email.noContactsFound")}</CommandEmpty>
                            <CommandGroup>
                              {filteredContacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  onSelect={() => addBccRecipient(contact)}
                                  className="flex items-center"
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <User className="h-4 w-4" />
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm">{contact.label}</span>
                                    <span className="text-xs text-muted-foreground">{contact.value}</span>
                                    {contact.company && (
                                      <span className="text-xs text-muted-foreground">{contact.company}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Visualizzazione dei destinatari in BCC */}
                  {bccRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bccRecipients.map(recipient => (
                        <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1">
                          {recipient.label}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeBccRecipient(recipient.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Rimuovi</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <FormControl>
                    <Input {...field} placeholder="nome@esempio.com" />
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
                  <FormLabel>{T(t, "email.subject", "Oggetto")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={T(t, "email.subjectPlaceholder", "Oggetto dell'email")} />
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
                  <FormLabel>{t("email.body")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("email.bodyPlaceholder")}
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gestione allegati */}
            <div>
              <FormLabel>{t("email.attachments")}</FormLabel>
              
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center">
                        <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeAttachment(index)}
                        title={t("email.removeAttachment")}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t("email.removeAttachment")}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  id="attachments"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachments")?.click()}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  {t("email.addAttachment")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}