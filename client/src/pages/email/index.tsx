import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Settings, Inbox, Send, Archive, Trash, Edit } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import EmailAccountsList from "@/components/email/EmailAccountsList";
import NewEmailAccountModal from "@/components/email/NewEmailAccountModal";
import EmailInbox from "@/components/email/EmailInbox";
import NewEmailComposer from "@/components/email/NewEmailComposer";
import { EmptyState } from "@/components/ui/empty-state";

export default function EmailPage() {
  const { t } = useTranslation();
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<{
    id: number;
    from: string;
    to: string[];
    subject: string;
  } | undefined>(undefined);

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["/api/email/accounts"],
    retry: false,
  });

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("dashboard.title")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/email" isCurrentPage>
                {t("email.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <h1 className="text-3xl font-bold mt-2">{t("email.title")}</h1>
          <p className="text-muted-foreground">{t("email.description")}</p>
        </div>
        <div className="flex gap-2">
          {selectedAccountId && (
            <Button onClick={() => setIsComposing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("email.compose")}
            </Button>
          )}
          <Button onClick={() => setShowNewAccountModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("email.addAccount")}
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("email.accounts")}</CardTitle>
              <CardDescription>{t("email.accountsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAccounts ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <EmailAccountsList 
                  accounts={accounts || []} 
                  selectedAccountId={selectedAccountId}
                  onAccountSelect={(id) => setSelectedAccountId(id)}
                />
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t("email.folders")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Button 
                  variant={activeTab === "inbox" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("inbox")}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  {t("email.inbox")}
                </Button>
                <Button 
                  variant={activeTab === "sent" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("sent")}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t("email.sent")}
                </Button>
                <Button 
                  variant={activeTab === "archive" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("archive")}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {t("email.archive")}
                </Button>
                <Button 
                  variant={activeTab === "trash" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("trash")}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t("email.trash")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-12 md:col-span-9">
          {isComposing && selectedAccountId ? (
            <NewEmailComposer 
              accountId={selectedAccountId}
              onCancel={() => setIsComposing(false)}
              onSent={() => {
                setIsComposing(false);
                // Se necessario, qui possiamo aggiornare la lista delle email inviate
              }}
              replyToEmail={replyToEmail}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedAccountId ? (
                    <>
                      {activeTab === "inbox" && t("email.inbox")}
                      {activeTab === "sent" && t("email.sent")}
                      {activeTab === "archive" && t("email.archive")}
                      {activeTab === "trash" && t("email.trash")}
                    </>
                  ) : (
                    t("email.noAccountSelected")
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedAccountId ? (
                  <EmptyState
                    icon={<Settings className="h-10 w-10" />}
                    title={t("email.noAccountSelectedTitle")}
                    description={t("email.noAccountSelectedDescription")}
                    action={
                      <Button onClick={() => setShowNewAccountModal(true)}>
                        {t("email.addAccount")}
                      </Button>
                    }
                  />
                ) : (
                  <EmailInbox 
                    accountId={selectedAccountId} 
                    folder={activeTab}
                    onReply={(email) => {
                      setReplyToEmail({
                        id: email.id,
                        from: email.from,
                        to: email.to,
                        subject: email.subject
                      });
                      setIsComposing(true);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showNewAccountModal && (
        <NewEmailAccountModal
          onClose={() => setShowNewAccountModal(false)}
          onAccountCreated={(newAccountId) => {
            setShowNewAccountModal(false);
            setSelectedAccountId(newAccountId);
          }}
        />
      )}
    </div>
  );
}