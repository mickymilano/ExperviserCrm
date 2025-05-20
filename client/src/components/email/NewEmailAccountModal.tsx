import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2 } from "lucide-react";

const emailProviders = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "yahoo", label: "Yahoo Mail" },
  { value: "generic", label: "Altro (IMAP/SMTP)" },
];

const formSchema = z.object({
  name: z.string().min(1, { message: "Il nome è obbligatorio" }),
  email: z.string().email({ message: "Email non valida" }),
  provider: z.string().min(1, { message: "Seleziona un provider" }),
  imapServer: z.string().min(1, { message: "Server IMAP obbligatorio" }),
  imapPort: z.coerce
    .number()
    .min(1, { message: "Porta IMAP non valida" })
    .max(65535, { message: "Porta IMAP non valida" }),
  imapSecurity: z.enum(["ssl", "tls", "none"]).default("ssl"),
  smtpServer: z.string().min(1, { message: "Server SMTP obbligatorio" }),
  smtpPort: z.coerce
    .number()
    .min(1, { message: "Porta SMTP non valida" })
    .max(65535, { message: "Porta SMTP non valida" }),
  smtpSecurity: z.enum(["ssl", "tls", "none"]).default("tls"),
  username: z.string().min(1, { message: "Username obbligatorio" }),
  password: z.string().min(1, { message: "Password obbligatoria" }),
  useSSL: z.boolean().default(true), // Manteniamo per compatibilità
});

type FormValues = z.infer<typeof formSchema>;

interface NewEmailAccountModalProps {
  onClose: () => void;
  onAccountCreated: (newAccountId: number) => void;
}

export default function NewEmailAccountModal({
  onClose,
  onAccountCreated,
}: NewEmailAccountModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      provider: "",
      imapServer: "",
      imapPort: 993,
      imapSecurity: "ssl",
      smtpServer: "",
      smtpPort: 587,
      smtpSecurity: "tls",
      username: "",
      password: "",
      useSSL: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest("/api/email/accounts", {
        method: "POST",
        data: values,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      toast({
        title: t("email.accountCreated"),
        description: t("email.accountCreatedDescription"),
      });
      onAccountCreated(data.id);
    },
    onError: (error) => {
      toast({
        title: t("email.accountError"),
        description: t("email.accountErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    const values = form.getValues();
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }

    setTestingConnection(true);
    try {
      await apiRequest("/api/email/accounts/test", {
        method: "POST",
        data: values,
      });
      toast({
        title: t("email.testSuccess"),
        description: t("email.testSuccessDescription"),
      });
    } catch (error) {
      toast({
        title: t("email.testError"),
        description: t("email.testErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // Set server details based on provider
  const onProviderChange = (value: string) => {
    let imapServer = "";
    let imapPort = 993;
    let smtpServer = "";
    let smtpPort = 587;
    let useSSL = true;

    switch (value) {
      case "gmail":
        imapServer = "imap.gmail.com";
        smtpServer = "smtp.gmail.com";
        break;
      case "outlook":
        imapServer = "outlook.office365.com";
        smtpServer = "smtp.office365.com";
        break;
      case "yahoo":
        imapServer = "imap.mail.yahoo.com";
        smtpServer = "smtp.mail.yahoo.com";
        break;
    }

    form.setValue("imapServer", imapServer);
    form.setValue("imapPort", imapPort);
    form.setValue("smtpServer", smtpServer);
    form.setValue("smtpPort", smtpPort);
    form.setValue("useSSL", useSSL);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("email.newAccount")}</DialogTitle>
          <DialogDescription>
            {t("email.newAccountDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.accountName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("email.accountNamePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.email")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="you@example.com" />
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
                  <FormLabel>{t("email.provider")}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      onProviderChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("email.selectProvider")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emailProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imapServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server IMAP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="imap.example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imapPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta IMAP</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imapSecurity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sicurezza IMAP</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di connessione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ssl">SSL/TLS</SelectItem>
                      <SelectItem value="tls">STARTTLS</SelectItem>
                      <SelectItem value="none">Nessuna (non sicura)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    SSL/TLS è raccomandato per la maggior parte dei server.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtpServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server SMTP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="smtp.example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta SMTP</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="smtpSecurity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sicurezza SMTP</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di connessione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ssl">SSL/TLS</SelectItem>
                      <SelectItem value="tls">STARTTLS</SelectItem>
                      <SelectItem value="none">Nessuna (non sicura)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    STARTTLS è raccomandato per la maggior parte dei server SMTP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.username")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="you@example.com" />
                  </FormControl>
                  <FormDescription>
                    {t("email.usernameDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.password")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    {t("email.passwordDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6 flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={testConnection}
                disabled={testingConnection || mutation.isPending}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("email.testing")}
                  </>
                ) : (
                  t("email.testConnection")
                )}
              </Button>
              <div className="space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={mutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("email.saving")}
                    </>
                  ) : (
                    t("save")
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}