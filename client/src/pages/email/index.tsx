import { useState } from "react";
import { useEmails, useMarkEmailAsRead } from "@/hooks/useEmails";
import { useEmailAccounts, useSyncAllEmailAccounts } from "@/hooks/useEmailAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Star, 
  Plus, 
  Search, 
  Mail, 
  Settings,
  RefreshCw,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmailList } from "@/components/email/EmailList";
import { EmailDetail } from "@/components/email/EmailDetail";
import EmailModal from "@/components/modals/EmailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function Email() {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const { data: emails, isLoading } = useEmails();
  const { data: accounts, isLoading: isLoadingAccounts } = useEmailAccounts();
  const { mutate: syncAllAccounts, isPending: isSyncing } = useSyncAllEmailAccounts();

  // Garantisco che emails sia sempre un Array
  const emailsList = Array.isArray(emails) ? emails : [];
  
  // Contatore per le email non lette
  const unreadCount = emailsList.filter(e => !e.isRead && e.folder === "inbox").length;
  
  // Handler per la selezione di una email
  const handleSelectEmail = (emailId: number) => {
    setSelectedEmailId(emailId);
  };
  
  // Handler per tornare alla lista delle email
  const handleBackToList = () => {
    setSelectedEmailId(null);
  };
  
  // Handler per il cambio di cartella
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedEmailId(null); // Chiudi l'email selezionata quando cambi cartella
  };
  
  // Handler per la risposta a una email
  const handleReplyToEmail = (emailId: number) => {
    // Trovi l'email corretta e apri il modal di composizione con quella email precaricata
    setShowComposeModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Email</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowComposeModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Compose
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => syncAllAccounts()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Email Sidebar */}
        <div className="col-span-1">
          <Card>
            <CardContent className="p-4">
              <Button className="w-full mb-4" onClick={() => setShowComposeModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Compose
              </Button>
              
              <div className="space-y-1 mb-6">
                <Button 
                  variant={selectedFolder === "inbox" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleFolderChange("inbox")}
                >
                  <Inbox className="mr-2 h-4 w-4" /> Inbox
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant={selectedFolder === "sent" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleFolderChange("sent")}
                >
                  <Send className="mr-2 h-4 w-4" /> Sent
                </Button>
                <Button 
                  variant={selectedFolder === "starred" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleFolderChange("starred")}
                >
                  <Star className="mr-2 h-4 w-4" /> Starred
                </Button>
                <Button 
                  variant={selectedFolder === "archive" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleFolderChange("archive")}
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
                <Button 
                  variant={selectedFolder === "trash" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleFolderChange("trash")}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Trash
                </Button>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Email Accounts</h3>
                  <div className="flex space-x-1">
                    <Link href="/email/settings">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Email Settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/email/accounts">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Add Account">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {isLoadingAccounts ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const accountsList = Array.isArray(accounts) ? accounts : [];
                      
                      return accountsList.length > 0 ? (
                        <div className="space-y-1">
                          {accountsList.map(account => (
                            <div key={account.id} className="flex items-center text-sm p-2 rounded-md hover:bg-muted">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="truncate">{account.email}</span>
                              {account.isPrimary && (
                                <Badge className="ml-auto" variant="outline">Primary</Badge>
                              )}
                            </div>
                          ))}
                          <Link href="/email/settings" className="block pt-1 text-xs text-primary hover:underline text-center">
                            Manage Email Settings
                          </Link>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>No email accounts configured.</p>
                          <div className="flex flex-col gap-1">
                            <Link href="/email/accounts" className="block text-xs text-primary hover:underline">
                              Add Email Account
                            </Link>
                            <Link href="/email/settings" className="block text-xs text-primary hover:underline">
                              Email Settings
                            </Link>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Content */}
        <div className="col-span-1 lg:col-span-3">
          {selectedEmailId ? (
            // Visualizzazione dettaglio email
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToList} 
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
              <EmailDetail 
                emailId={selectedEmailId} 
                onReply={handleReplyToEmail} 
                onBack={handleBackToList} 
              />
            </div>
          ) : (
            // Visualizzazione lista email
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search emails..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="important">Important</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
              
              <EmailList 
                folder={selectedFolder}
                onViewEmail={handleSelectEmail}
              />
            </div>
          )}
        </div>
      </div>

      <EmailModal
        open={showComposeModal}
        onOpenChange={setShowComposeModal}
      />
    </div>
  );
}
