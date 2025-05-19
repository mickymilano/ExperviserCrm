import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { T } from "@/lib/translationHelper";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useCreateEmailAccount, useUpdateEmailAccount, EmailAccount } from "@/hooks/useEmailAccounts";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome account obbligatorio" }),
  email: z.string().email({ message: "Formato email non valido" }),
  password: z.string().min(1, { message: "Password obbligatoria" }),
  provider: z.string().min(1, { message: "Seleziona un provider" }),
  useCustomServers: z.boolean().default(false),
  incomingServer: z.string().optional(),
  incomingPort: z.string().optional(),
  outgoingServer: z.string().optional(),
  outgoingPort: z.string().optional(),
  security: z.enum(["none", "ssl", "tls"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const providerOptions = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook / Office 365" },
  { value: "yahoo", label: "Yahoo Mail" },
  { value: "imap", label: "IMAP/SMTP Generico" },
];

interface EmailAccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  accountToEdit?: EmailAccount | null;
  isEditing?: boolean;
}

export default function EmailAccountForm({ onSuccess, onCancel, accountToEdit, isEditing = false }: EmailAccountFormProps) {
  const { t } = useTranslation();
  const [useCustomSettings, setUseCustomSettings] = useState(accountToEdit?.serverSettings ? true : false);
  
  // Utilizziamo createAccount per gli account nuovi, updateAccount per le modifiche
  const createAccountMutation = useCreateEmailAccount();
  const updateAccountMutation = useUpdateEmailAccount();

  // Valori predefiniti per il form, che verranno sovrascritti se si sta modificando un account esistente
  const defaultValues = {
    name: accountToEdit?.name || "",
    email: accountToEdit?.email || "",
    password: "",  // Non possiamo caricare la password per motivi di sicurezza
    provider: accountToEdit?.provider || "",
    useCustomServers: accountToEdit?.serverSettings ? true : false,
    incomingServer: accountToEdit?.serverSettings?.incomingServer || "",
    incomingPort: accountToEdit?.serverSettings?.incomingPort?.toString() || "",
    outgoingServer: accountToEdit?.serverSettings?.outgoingServer || "",
    outgoingPort: accountToEdit?.serverSettings?.outgoingPort?.toString() || "",
    security: (accountToEdit?.serverSettings?.security as any) || "ssl",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Quando cambia l'account da modificare, aggiorniamo i valori del form
  useEffect(() => {
    if (accountToEdit) {
      form.reset({
        name: accountToEdit.name,
        email: accountToEdit.email,
        password: "",  // Non carichiamo la password per motivi di sicurezza
        provider: accountToEdit.provider,
        useCustomServers: accountToEdit.serverSettings ? true : false,
        incomingServer: accountToEdit.serverSettings?.incomingServer || "",
        incomingPort: accountToEdit.serverSettings?.incomingPort?.toString() || "",
        outgoingServer: accountToEdit.serverSettings?.outgoingServer || "",
        outgoingPort: accountToEdit.serverSettings?.outgoingPort?.toString() || "",
        security: (accountToEdit.serverSettings?.security as any) || "ssl",
      });
      
      if (accountToEdit.serverSettings) {
        setUseCustomSettings(true);
      }
    }
  }, [accountToEdit, form]);

  const onSubmit = (values: FormValues) => {
    const formData = {
      name: values.name,
      email: values.email,
      password: values.password,
      provider: values.provider,
    };

    // Se sono abilitati i server personalizzati, aggiungi quelle impostazioni
    if (values.useCustomServers) {
      Object.assign(formData, {
        serverSettings: {
          incomingServer: values.incomingServer,
          incomingPort: parseInt(values.incomingPort || "993", 10),
          outgoingServer: values.outgoingServer,
          outgoingPort: parseInt(values.outgoingPort || "587", 10),
          security: values.security,
        },
      });
    }

    // Gestione diversa in base a se stiamo modificando o creando un account
    if (isEditing && accountToEdit) {
      // In caso di modifica, usiamo updateAccountMutation
      // Nota: per l'aggiornamento dobbiamo includere l'ID dell'account
      updateAccountMutation.mutate(
        { 
          id: accountToEdit.id, 
          ...formData 
        } as any, 
        {
          onSuccess: () => {
            onSuccess();
          },
          onError: (error) => {
            console.error("Errore nella modifica dell'account:", error);
          }
        }
      );
    } else {
      // In caso di creazione, usiamo createAccountMutation
      createAccountMutation.mutate(formData as any, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          console.error("Errore nella creazione dell'account:", error);
        }
      });
    }
  };

  const handleProviderChange = (provider: string) => {
    form.setValue("provider", provider);

    // Imposta valori predefiniti in base al provider selezionato
    if (provider === "gmail") {
      form.setValue("incomingServer", "imap.gmail.com");
      form.setValue("incomingPort", "993");
      form.setValue("outgoingServer", "smtp.gmail.com");
      form.setValue("outgoingPort", "587");
      form.setValue("security", "ssl");
    } else if (provider === "outlook") {
      form.setValue("incomingServer", "outlook.office365.com");
      form.setValue("incomingPort", "993");
      form.setValue("outgoingServer", "smtp.office365.com");
      form.setValue("outgoingPort", "587");
      form.setValue("security", "ssl");
    } else if (provider === "yahoo") {
      form.setValue("incomingServer", "imap.mail.yahoo.com");
      form.setValue("incomingPort", "993");
      form.setValue("outgoingServer", "smtp.mail.yahoo.com");
      form.setValue("outgoingPort", "587");
      form.setValue("security", "ssl");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{T(t, "emailSettings.accountName", "Nome account")}</FormLabel>
              <FormControl>
                <Input placeholder={T(t, "emailSettings.accountNamePlaceholder", "Es: Gmail personale")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{T(t, "emailSettings.provider", "Provider")}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleProviderChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={T(t, "emailSettings.selectProvider", "Seleziona provider")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {providerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{T(t, "emailSettings.emailAddress", "Indirizzo email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nome@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{T(t, "emailSettings.password", "Password")}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="useCustomServers"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {T(t, "emailSettings.advancedSettings", "Impostazioni avanzate")}
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  {T(t, "emailSettings.advancedSettingsDescription", "Configura server IMAP/SMTP personalizzati")}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setUseCustomSettings(checked);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {useCustomSettings && (
          <Accordion type="single" collapsible defaultValue="serverSettings">
            <AccordionItem value="serverSettings">
              <AccordionTrigger>
                {T(t, "emailSettings.serverSettings", "Impostazioni server")}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incomingServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{T(t, "emailSettings.incomingServer", "Server IMAP")}</FormLabel>
                        <FormControl>
                          <Input placeholder="imap.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incomingPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{T(t, "emailSettings.incomingPort", "Porta IMAP")}</FormLabel>
                        <FormControl>
                          <Input placeholder="993" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="outgoingServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{T(t, "emailSettings.outgoingServer", "Server SMTP")}</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="outgoingPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{T(t, "emailSettings.outgoingPort", "Porta SMTP")}</FormLabel>
                        <FormControl>
                          <Input placeholder="587" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="security"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{T(t, "emailSettings.security", "Sicurezza")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={T(t, "emailSettings.selectSecurity", "Seleziona sicurezza")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ssl">SSL/TLS</SelectItem>
                          <SelectItem value="tls">STARTTLS</SelectItem>
                          <SelectItem value="none">{T(t, "emailSettings.none", "Nessuna")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {T(t, "common.cancel", "Annulla")}
          </Button>
          <Button 
            type="submit" 
            disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
          >
            {createAccountMutation.isPending || updateAccountMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {T(t, "common.saving", "Salvataggio...")}
              </>
            ) : (
              isEditing ? T(t, "common.update", "Aggiorna") : T(t, "common.save", "Salva")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}