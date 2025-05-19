import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Archive,
  User,
  Paperclip,
  Mail,
} from "lucide-react";

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
  hasAttachments?: boolean;
  accountId: number;
}

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
}

export default function EmailDetailView({
  email,
  onBack,
  onReply,
  onForward,
  onDelete,
}: EmailDetailViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const markAsReadProcessed = useRef(false);

  // Mutation per segnare l'email come letta se non lo è già
  const markAsReadMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/email/messages/${email.id}/read`, {
        method: "POST"
      }).then(response => {
        if (!response.ok) {
          throw new Error('Errore nel segnare l\'email come letta');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/email/accounts/${email.accountId}/messages`],
      });
    }
  });

  // Usa useEffect per eseguire la mutation solo una volta quando il componente è montato
  // o quando cambia l'email visualizzata
  useEffect(() => {
    // Evita di chiamare la mutation se è già stata processata o se l'email è già letta
    if (!markAsReadProcessed.current && !email.read) {
      markAsReadProcessed.current = true;
      markAsReadMutation.mutate();
    }
    
    return () => {
      // Reset il flag quando il componente viene smontato o l'email cambia
      markAsReadProcessed.current = false;
    };
  }, [email.id, email.read]);

  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE d MMMM yyyy, HH:mm", { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  const extractName = (email: string) => {
    // Se l'email ha un formato "Nome Cognome <email@example.com>"
    const match = email.match(/^([^<]+)<([^>]+)>$/);
    if (match) {
      return match[1].trim();
    }
    
    // Altrimenti prova a rendere più leggibile l'indirizzo email
    const localPart = email.split("@")[0];
    return localPart
      .replace(/[._-]/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("email.back")}
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onReply}>
            <Reply className="mr-2 h-4 w-4" />
            {t("email.reply")}
          </Button>
          <Button variant="outline" size="sm" onClick={onForward}>
            <Forward className="mr-2 h-4 w-4" />
            {t("email.forward")}
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("email.delete")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">{email.subject}</h2>
          <div className="text-muted-foreground text-sm">
            {formatFullDate(email.date)}
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2 pb-4 border-b">
          <Avatar>
            <User className="h-5 w-5" />
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{email.fromName || extractName(email.from)}</div>
            <div className="text-sm text-muted-foreground">{email.from}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">{t("email.to")}:</span>{" "}
            {email.to.join(", ")}
          </div>
          {email.cc && email.cc.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">{t("email.cc")}:</span>{" "}
              {email.cc.join(", ")}
            </div>
          )}
        </div>

        {email.hasAttachments && (
          <div className="py-2 border-t border-b">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("email.attachments")}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("email.attachmentsNotImplemented")}
            </div>
          </div>
        )}

        <div className="py-4">
          {/* Utilizzare dangerouslySetInnerHTML per renderizzare il corpo HTML dell'email */}
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      </div>
    </div>
  );
}