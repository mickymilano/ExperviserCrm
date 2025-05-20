import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Mail, Trash, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  lastSynced: string | null;
  isActive: boolean;
}

interface EmailAccountsListProps {
  accounts: EmailAccount[];
  selectedAccountId: number | null;
  onAccountSelect: (id: number) => void;
}

export default function EmailAccountsList({
  accounts,
  selectedAccountId,
  onAccountSelect,
}: EmailAccountsListProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: (accountId: number) => {
      return apiRequest(`/api/email/accounts/${accountId}/sync`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      toast({
        title: t("email.syncSuccess"),
        description: t("email.syncSuccessDescription"),
      });
    },
    onError: (error) => {
      toast({
        title: t("email.syncError"),
        description: t("email.syncErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: number) => {
      return apiRequest(`/api/email/accounts/${accountId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      toast({
        title: t("email.deleteSuccess"),
        description: t("email.deleteSuccessDescription"),
      });
    },
    onError: (error) => {
      toast({
        title: t("email.deleteError"),
        description: t("email.deleteErrorDescription"),
        variant: "destructive",
      });
    },
  });

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">{t("email.noAccounts")}</p>
      </div>
    );
  }

  const handleSyncAccount = (accountId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    syncMutation.mutate(accountId);
  };

  const handleDeleteAccount = (accountId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Chiedi conferma prima di eliminare l'account
    if (window.confirm(t("email.confirmDelete"))) {
      deleteMutation.mutate(accountId);
    }
  };

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
            selectedAccountId === account.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => onAccountSelect(account.id)}
        >
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">{account.name}</div>
              <div className="text-xs opacity-70">{account.email}</div>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                selectedAccountId === account.id
                  ? "hover:bg-primary-foreground/20 text-primary-foreground"
                  : ""
              }`}
              onClick={(e) => handleSyncAccount(account.id, e)}
              disabled={syncMutation.isPending}
              title={t("email.sync")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                selectedAccountId === account.id
                  ? "hover:bg-primary-foreground/20 text-primary-foreground"
                  : ""
              }`}
              onClick={(e) => handleDeleteAccount(account.id, e)}
              disabled={deleteMutation.isPending}
              title={t("email.delete")}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}