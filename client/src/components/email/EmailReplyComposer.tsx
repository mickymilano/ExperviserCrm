import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { T } from "@/lib/translationHelper";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmailAccountSelector } from "@/components/email/EmailAccountSelector";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { ArrowLeft, PaperclipIcon, Send, X, Loader2 } from "lucide-react";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Interfaccia per rappresentare un'email
interface Email {
  id: number;
  accountId: number;
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
}

// Interfaccia per entità correlate alle email
export type EntityType = "contact" | "company" | "lead" | "deal" | "branch";

const formSchema = z.object({
  accountId: z.number({
    required_error: "Seleziona un account email",
  }),
  to: z.string().min(1, { message: "Destinatario obbligatorio" }),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, { message: "Oggetto obbligatorio" }),
  body: z.string().min(1, { message: "Corpo del messaggio obbligatorio" }),
});

// Proprietà del componente
interface EmailReplyComposerProps {
  originalEmail: Email;
  onCancel: () => void;
  onSent: () => void;
  entityId?: number;
  entityType?: EntityType;
  entityEmail?: string;
}

export default function EmailReplyComposer({
  originalEmail,
  onCancel,
  onSent,
  entityId,
  entityType,
  entityEmail
}: EmailReplyComposerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAiAssisted, setIsAiAssisted] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const { data: accounts } = useEmailAccounts();

  // Prepara il corpo dell'email con la citazione originale
  const prepareReplyBody = (originalEmail: Email) => {
    const date = new Date(originalEmail.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `\n\n\n------------------\n${T(t, "email.originalMessage", "Messaggio originale")}:\n${T(t, "email.from", "Da")}: ${originalEmail.fromName || originalEmail.from}\n${T(t, "email.date", "Data")}: ${date}\n${T(t, "email.subject", "Oggetto")}: ${originalEmail.subject}\n\n${originalEmail.body.replace(/<[^>]*>/g, "")}`;
  };

  // Prepara l'oggetto dell'email di risposta
  const prepareReplySubject = (subject: string) => {
    return subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  };

  // Trova l'account che ha ricevuto l'email originale
  const findMatchingAccount = () => {
    if (!accounts || accounts.length === 0) return null;
    // Se l'email originale specifica un accountId, controlla se è presente
    const originalAccount = accounts.find(acc => acc.id === originalEmail.accountId);
    if (originalAccount) return originalAccount.id;
    // Altrimenti, prendi il primo account disponibile
    return accounts[0].id;
  };

  // Prepara i valori predefiniti del form
  const defaultValues = {
    accountId: findMatchingAccount() || 0,
    to: originalEmail.from,
    cc: "",
    bcc: "",
    subject: prepareReplySubject(originalEmail.subject),
    body: prepareReplyBody(originalEmail),
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Mutazione per inviare l'email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Prepara i destinatari come array
      const formattedData = {
        ...data,
        to: data.to.split(",").map(email => email.trim()),
        cc: data.cc ? data.cc.split(",").map(email => email.trim()) : [],
        bcc: data.bcc ? data.bcc.split(",").map(email => email.trim()) : [],
        inReplyTo: originalEmail.id,
        entityId,
        entityType,
      };
      return apiRequest('POST', '/api/email/send', formattedData);
    },
    onSuccess: () => {
      // Invalida le query per aggiornare la visualizzazione delle email
      if (entityId && entityType) {
        queryClient.invalidateQueries({ queryKey: [`/api/email/filter/${entityType}/${entityId}`] });
      }
      toast({
        title: T(t, "email.sentSuccess", "Email inviata"),
        description: T(t, "email.sentSuccessDescription", "La tua email è stata inviata con successo"),
      });
      onSent();
    },
    onError: (error: any) => {
      toast({
        title: T(t, "email.sendError", "Errore nell'invio"),
        description: error.message || T(t, "email.sendErrorDescription", "Si è verificato un errore durante l'invio dell'email"),
        variant: "destructive",
      });
    },
  });

  // Funzione per generare una risposta assistita dall'AI
  const generateAiResponse = async () => {
    if (!process.env.OPENAI_API_KEY) {
      toast({
        title: T(t, "email.aiUnavailable", "AI non disponibile"),
        description: T(t, "email.aiUnavailableDescription", "La chiave API OpenAI non è configurata"),
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingResponse(true);
    try {
      // Prepara il contesto per l'AI
      const context = {
        originalEmail: {
          subject: originalEmail.subject,
          body: originalEmail.body.replace(/<[^>]*>/g, ""),
          from: originalEmail.fromName || originalEmail.from,
        },
        entityType,
        entityId,
      };

      // Richiedi una risposta generata dall'AI
      const response = await apiRequest('POST', '/api/ai/generate-email-response', context);
      
      if (response && response.generatedResponse) {
        // Aggiungi la risposta generata dall'AI al corpo dell'email
        const currentBody = form.getValues("body");
        const aiResponseWithSignature = response.generatedResponse + "\n\n" + currentBody;
        form.setValue("body", aiResponseWithSignature);
      }
    } catch (error: any) {
      console.error("Errore nella generazione della risposta AI:", error);
      toast({
        title: T(t, "email.aiGenerationError", "Errore AI"),
        description: error.message || T(t, "email.aiGenerationErrorDescription", "Impossibile generare una risposta assistita dall'AI"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Funzione per inviare l'email
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await sendEmailMutation.mutateAsync(values);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl">{T(t, "email.replyToEmail", "Rispondi all'email")}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Selezione account email */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{T(t, "email.fromAccount", "Account mittente")}</FormLabel>
                  <EmailAccountSelector
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destinatario */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{T(t, "email.to", "A")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@esempio.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CC */}
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{T(t, "email.cc", "CC")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@esempio.com, altro@esempio.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Oggetto */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{T(t, "email.subject", "Oggetto")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Corpo email */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{T(t, "email.message", "Messaggio")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={10}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {T(t, "common.cancel", "Annulla")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={generateAiResponse}
                disabled={isGeneratingResponse}
              >
                {isGeneratingResponse ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <span className="mr-2">AI</span>
                )}
                {isGeneratingResponse 
                  ? T(t, "email.generatingResponse", "Generazione risposta...") 
                  : T(t, "email.generateAiResponse", "Genera risposta AI")}
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sendEmailMutation.isPending 
                ? T(t, "email.sending", "Invio in corso...") 
                : T(t, "email.send", "Invia")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}