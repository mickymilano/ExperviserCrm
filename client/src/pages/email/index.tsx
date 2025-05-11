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
  Paperclip,
  Tag,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EmailModal from "@/components/modals/EmailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Email() {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: emails, isLoading } = useEmails();
  const { data: accounts, isLoading: isLoadingAccounts } = useEmailAccounts();
  const { mutate: markAsRead } = useMarkEmailAsRead();
  const { mutate: syncAllAccounts, isPending: isSyncing } = useSyncAllEmailAccounts();

  // Filter emails based on search term
  const filteredEmails = emails?.filter((email) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      email.subject.toLowerCase().includes(searchTermLower) ||
      email.from.toLowerCase().includes(searchTermLower) ||
      email.to.some(recipient => recipient.toLowerCase().includes(searchTermLower))
    );
  });

  const handleEmailClick = (id: number) => {
    if (emails?.find(e => e.id === id)?.read === false) {
      markAsRead(id);
    }
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
                <Button variant="ghost" className="w-full justify-start">
                  <Inbox className="mr-2 h-4 w-4" /> Inbox
                  <span className="ml-auto bg-primary text-white text-xs rounded-full px-2">
                    {emails?.filter(e => !e.read).length || 0}
                  </span>
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Send className="mr-2 h-4 w-4" /> Sent
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Star className="mr-2 h-4 w-4" /> Starred
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
                <Button variant="ghost" className="w-full justify-start">
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
                ) : accounts && accounts.length > 0 ? (
                  <div className="space-y-1">
                    {accounts.map(account => (
                      <div key={account.id} className="flex items-center text-sm p-2 rounded-md hover:bg-muted">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">{account.email}</span>
                        {account.id === 1 && (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Content */}
        <div className="col-span-1 lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center mb-2">
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
              </div>

              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredEmails && filteredEmails.length > 0 ? (
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <div 
                      key={email.id} 
                      className={cn(
                        "p-4 hover:bg-muted/50 cursor-pointer",
                        !email.read && "bg-blue-50 dark:bg-blue-950/20"
                      )}
                      onClick={() => handleEmailClick(email.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 pt-1">
                            {!email.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium mb-1">{email.subject}</div>
                            <div className="text-sm text-muted-foreground mb-2">{email.from}</div>
                            <p className="text-sm line-clamp-2">
                              {email.body.substring(0, 120)}
                              {email.body.length > 120 && '...'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
                          </span>
                          <div className="flex space-x-1">
                            {Math.random() > 0.7 && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                            {Math.random() > 0.5 && <Tag className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No emails found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Your inbox is empty."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EmailModal
        open={showComposeModal}
        onOpenChange={setShowComposeModal}
      />
    </div>
  );
}
