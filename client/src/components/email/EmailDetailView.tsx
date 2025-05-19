import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Paperclip,
  Download,
  User,
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
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    id: string;
  }>;
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy, HH:mm", { locale: it });
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

  const formatEmailAddress = (address: string) => {
    const name = extractName(address);
    const emailPart = address.match(/<([^>]+)>/) ? address.match(/<([^>]+)>/)![1] : address;
    
    return (
      <span>
        {name}{" "}
        <span className="text-muted-foreground">&lt;{emailPart}&gt;</span>
      </span>
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} className="pl-0">
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
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("email.delete")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{email.subject}</h2>
          <div className="flex items-center mt-2">
            <Avatar className="h-8 w-8 mr-2">
              <User className="h-4 w-4" />
            </Avatar>
            <div>
              <div className="font-medium">{email.fromName || extractName(email.from)}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(email.date)}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm">
          <div className="flex">
            <span className="font-medium w-12">{t("email.to")}:</span>
            <div className="flex-1">
              {email.to?.map((address, i) => (
                <div key={i}>{formatEmailAddress(address)}</div>
              ))}
            </div>
          </div>
          
          {email.cc && email.cc.length > 0 && (
            <div className="flex mt-1">
              <span className="font-medium w-12">{t("email.cc")}:</span>
              <div className="flex-1">
                {email.cc.map((address, i) => (
                  <div key={i}>{formatEmailAddress(address)}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="prose prose-sm max-w-none">
          {email.body.includes("<") ? (
            <div dangerouslySetInnerHTML={{ __html: email.body }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{email.body}</pre>
          )}
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">
              <Paperclip className="inline h-4 w-4 mr-1" />
              {t("email.attachments")} ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{attachment.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatSize(attachment.size)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}