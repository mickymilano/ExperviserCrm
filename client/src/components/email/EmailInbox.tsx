import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RefreshCw,
  Search,
  Mail,
  Trash2,
  Archive,
  Reply,
  Forward,
  ChevronDown,
  PlusCircle,
  User,
} from "lucide-react";
import EmailDetailView from "./EmailDetailView";
import NewEmailComposer from "./NewEmailComposer";

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
}

interface EmailInboxProps {
  accountId: number;
  folder: string;
  onReply?: (email: Email) => void;
}

export default function EmailInbox({ accountId, folder, onReply }: EmailInboxProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composingEmail, setComposingEmail] = useState(false);
  
  const { data: emails, isLoading } = useQuery({
    queryKey: [`/api/email/accounts/${accountId}/messages`, folder],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/email/accounts/${accountId}/messages?folder=${folder}${
            searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
          }`
        ).then(res => res.json());
        // Assicuriamoci che la risposta sia un array
        if (response && Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object') {
          // Se la risposta è un oggetto con una proprietà che contiene l'array
          // Per esempio {messages: [...], total: 10}
          const possibleArrayProps = ['messages', 'data', 'emails', 'items'];
          for (const prop of possibleArrayProps) {
            if (response[prop] && Array.isArray(response[prop])) {
              return response[prop];
            }
          }
        }
        // Se non troviamo un array, restituiamo un array vuoto
        console.warn("Response is not an array:", response);
        return [];
      } catch (error) {
        console.error("Error fetching emails:", error);
        return [];
      }
    },
    enabled: !!accountId,
  });

  const syncMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/email/accounts/${accountId}/sync`, {
        method: "POST"
      }).then(response => {
        if (!response.ok) {
          throw new Error('Errore nella sincronizzazione delle email');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/email/accounts/${accountId}/messages`],
      });
      toast({
        title: t("email.syncSuccess"),
        description: t("email.syncSuccessDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("email.syncError"),
        description: t("email.syncErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({
      queryKey: [`/api/email/accounts/${accountId}/messages`],
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return format(date, "HH:mm", { locale: it });
      } else {
        return format(date, "dd MMM", { locale: it });
      }
    } catch (e) {
      return dateString;
    }
  };

  const extractInitials = (email: string) => {
    // Tenta di estrarre un nome dalla parte locale dell'email
    const localPart = email.split("@")[0];
    // Sostituisce caratteri non alfanumerici con spazi
    const nameParts = localPart.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
    
    if (nameParts.length > 1) {
      // Se ci sono più parti, prende le iniziali delle prime due
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
      // Se c'è una sola parte, prende la prima lettera
      return nameParts[0][0].toUpperCase();
    }
    
    // Fallback
    return "?";
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

  if (composingEmail) {
    return (
      <NewEmailComposer
        accountId={accountId}
        onCancel={() => setComposingEmail(false)}
        onSent={() => {
          setComposingEmail(false);
          queryClient.invalidateQueries({
            queryKey: [`/api/email/accounts/${accountId}/messages`],
          });
        }}
      />
    );
  }

  if (selectedEmail) {
    return (
      <EmailDetailView
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onReply={() => {
          if (onReply) {
            onReply(selectedEmail);
          } else {
            console.log("Reply to", selectedEmail.id);
          }
        }}
        onForward={() => {
          // Implementare inoltro
          console.log("Forward", selectedEmail.id);
        }}
        onDelete={() => {
          // Implementare eliminazione
          console.log("Delete", selectedEmail.id);
          setSelectedEmail(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("email.search")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            title={t("email.sync")}
          >
            <RefreshCw
              className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setComposingEmail(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("email.compose")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : !emails || !Array.isArray(emails) || emails.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-10 w-10" />}
          title={t("email.noEmails")}
          description={t("email.noEmailsDescription")}
          action={
            <Button onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("email.sync")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-1">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`flex items-start p-3 rounded-md hover:bg-muted cursor-pointer ${
                !email.read ? "bg-muted/50 font-medium" : ""
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              <Avatar className="mr-3 mt-1">
                <User className="h-5 w-5" />
                <div className="sr-only">{extractName(email.from)}</div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {email.fromName || extractName(email.from)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDate(email.date)}
                  </span>
                </div>
                <div className="text-sm font-medium truncate">{email.subject}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {email.body?.replace(/<[^>]*>/g, "").substring(0, 100) || ""}
                </div>
                <div className="flex items-center mt-1 space-x-2">
                  {email.hasAttachments && (
                    <Badge variant="outline" className="text-xs">
                      {t("email.attachment")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}