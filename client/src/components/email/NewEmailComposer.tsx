import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Paperclip, Send, X, Loader2 } from "lucide-react";

const formSchema = z.object({
  to: z.string().min(1, { message: "Destinatario obbligatorio" }),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, { message: "Oggetto obbligatorio" }),
  body: z.string().min(1, { message: "Corpo del messaggio obbligatorio" }),
});

type FormValues = z.infer<typeof formSchema>;

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

  const mutation = useMutation({
    mutationFn: (values: FormValues & { accountId: number; attachments?: File[] }) => {
      // Crea un FormData per inviare file allegati
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/email/accounts/${accountId}/messages`],
      });
      toast({
        title: t("email.sentSuccess"),
        description: t("email.sentSuccessDescription"),
      });
      onSent();
    },
    onError: (error) => {
      toast({
        title: t("email.sentError"),
        description: t("email.sentErrorDescription"),
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onCancel} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("email.back")}
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
                  {t("email.sending")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("email.send")}
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
                  <FormLabel>{t("email.to")}</FormLabel>
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
                  <FormLabel>{t("email.cc")}</FormLabel>
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
                  <FormLabel>{t("email.bcc")}</FormLabel>
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
                  <FormLabel>{t("email.subject")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("email.subjectPlaceholder")} />
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