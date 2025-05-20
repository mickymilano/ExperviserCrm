import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmail } from "@/hooks/useEmails";
import { format } from "date-fns";
import {
  ReplyAll,
  Reply,
  Trash2,
  Archive,
  Star,
  Printer,
  MoreHorizontal,
  File,
  Download,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmailModal from "@/components/modals/EmailModal";

interface EmailDetailProps {
  emailId: number;
  onReply: (emailId: number) => void;
  onBack: () => void;
}

export function EmailDetail({ emailId, onReply, onBack }: EmailDetailProps) {
  const { data: email, isLoading, isError } = useEmail(emailId);
  const [showReplyModal, setShowReplyModal] = useState(false);
  
  // Funzione per generare le iniziali dal nome dell'email
  const getInitials = (emailStr: string): string => {
    try {
      // Estrae solo il nome dalla stringa email (ad es. "John Doe <john@example.com>" -> "John Doe")
      const nameMatch = emailStr.match(/^([^<]+)/);
      const name = nameMatch ? nameMatch[1].trim() : emailStr.split('@')[0];
      
      // Prende la prima lettera di ogni parola nel nome
      return name
        .split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    } catch (error) {
      return '?';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </CardContent>
      </Card>
    );
  }
  
  if (isError || !email) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <h3 className="text-lg font-medium">Email Not Found</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            The email you're looking for does not exist or could not be loaded.
          </p>
          <Button className="mt-4" onClick={onBack}>Back to Inbox</Button>
        </CardContent>
      </Card>
    );
  }
  
  // Formatta la data completa
  const formattedDate = format(new Date(email.date), "EEEE, MMMM d, yyyy 'at' HH:mm");
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{email.subject}</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" onClick={onBack} title="Back to Inbox">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                  <DropdownMenuItem>Print</DropdownMenuItem>
                  <DropdownMenuItem>Add Star</DropdownMenuItem>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center pt-2">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback>{getInitials(email.from)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{email.from}</h3>
                  <p className="text-sm text-muted-foreground">
                    To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                    {email.cc && email.cc.length > 0 && (
                      <> • CC: {email.cc.join(', ')}</>
                    )}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">{formattedDate}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-4">
          {email.labels && email.labels.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {email.labels.map((label, idx) => (
                <Badge key={idx} variant="outline">{label}</Badge>
              ))}
            </div>
          )}
          
          <div className="email-body">
            {email.body ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
          
          {email.attachments && Object.keys(email.attachments).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Attachments ({Object.keys(email.attachments).length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(email.attachments).map(([filename, fileDetails], idx) => (
                  <div key={idx} className="flex items-center p-2 border rounded-md group">
                    <File className="h-5 w-5 mr-2 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof fileDetails === 'object' && fileDetails.size ? 
                          formatFileSize(fileDetails.size) : 
                          'Unknown size'}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-4 pb-4">
          <div className="flex space-x-2">
            <Button variant="default" onClick={() => setShowReplyModal(true)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline">
              <ReplyAll className="h-4 w-4 mr-2" />
              Reply All
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Reply Modal */}
      {email && (
        <EmailModal
          open={showReplyModal}
          onOpenChange={setShowReplyModal}
          replyTo={email}
        />
      )}
    </>
  );
}

// Funzione di utilità per formattare la dimensione del file
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}