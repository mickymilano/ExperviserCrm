import { useState } from "react";
import { useEmails, useMarkEmailAsRead } from "../../hooks/useEmails";
import { 
  Card, 
  CardContent 
} from "../ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { 
  Star, 
  Mail, 
  MailOpen, 
  Paperclip, 
  AlertCircle,
  Tag
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";

interface EmailListProps {
  folder?: string;
  onViewEmail?: (emailId: number) => void;
}

export function EmailList({ folder = 'inbox', onViewEmail }: EmailListProps) {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const { data: emails = [], isLoading, isError } = useEmails();
  const { mutate: markAsRead } = useMarkEmailAsRead();
  
  // Filtra le email per cartella
  const filteredEmails = emails.filter(email => email.folder === folder);
  
  // Funzione per selezionare/deselezionare tutte le email
  const toggleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };
  
  // Funzione per gestire il click su una email
  const handleEmailClick = (emailId: number) => {
    if (!emails.find(e => e.id === emailId)?.isRead) {
      markAsRead(emailId);
    }
    if (onViewEmail) {
      onViewEmail(emailId);
    }
  };
  
  // Funzione per gestire la selezione di una email
  const handleEmailSelect = (emailId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, emailId]);
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-2 flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-full max-w-md" />
              <Skeleton className="h-5 w-24 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <h3 className="text-lg font-medium">Failed to Load Emails</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            There was an error loading your emails. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (filteredEmails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <Mail className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No Emails</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {folder === 'inbox' ? "Your inbox is empty" : `No emails in ${folder}`}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all emails"
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmails.map(email => (
              <TableRow 
                key={email.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  !email.isRead && "font-medium bg-muted/30"
                )}
                onClick={() => handleEmailClick(email.id)}
              >
                <TableCell className="p-2" onClick={e => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedEmails.includes(email.id)}
                    onCheckedChange={(checked) => handleEmailSelect(email.id, checked as boolean)}
                    aria-label={`Select email from ${email.from}`}
                  />
                </TableCell>
                <TableCell className="p-2 pl-0">
                  <div className="flex items-center space-x-1">
                    {email.isRead ? 
                      <MailOpen className="h-4 w-4 text-muted-foreground" /> : 
                      <Mail className="h-4 w-4" />
                    }
                    {email.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                    {email.attachments && Object.keys(email.attachments).length > 0 && 
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-[180px]">{email.from}</span>
                    {email.labels && email.labels.length > 0 && (
                      <div className="flex space-x-1 ml-1">
                        {email.labels.map((label, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs py-0 px-1">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start">
                    <span className="truncate max-w-[300px]">{email.subject}</span>
                    {email.plainText && (
                      <span className="text-muted-foreground ml-2 truncate max-w-[200px] hidden md:inline">
                        - {email.plainText.substring(0, 50)}{email.plainText.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                  {formatEmailDate(email.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Funzione di utilità per formattare la data delle email
function formatEmailDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Se l'email è di oggi, mostra solo l'ora
  if (date.toDateString() === now.toDateString()) {
    return format(date, 'HH:mm');
  }
  
  // Se l'email è di questa settimana, mostra il giorno
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return format(date, 'EEE');
  }
  
  // Altrimenti mostra la data completa
  return format(date, 'dd/MM/yyyy');
}