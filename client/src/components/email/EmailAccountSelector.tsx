import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Check, PlusCircle, RotateCw } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useToast } from '@/hooks/use-toast';
import { T } from '@/lib/translationHelper';

interface EmailAccountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onAddAccount?: () => void;
}

export function EmailAccountSelector({ 
  value, 
  onChange, 
  disabled = false,
  onAddAccount
}: EmailAccountSelectorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { emailAccounts, isLoading, syncAccounts } = useEmailAccounts();
  const [isSyncing, setIsSyncing] = useState(false);

  // Imposta un valore di default quando gli account vengono caricati
  useEffect(() => {
    if (emailAccounts.length > 0 && value === 0) {
      // Trova un account principale se esiste
      const primaryAccount = emailAccounts.find(account => account.isPrimary);
      if (primaryAccount) {
        onChange(primaryAccount.id);
      } else {
        // Altrimenti usa il primo account
        onChange(emailAccounts[0].id);
      }
    }
  }, [emailAccounts, value, onChange]);

  const handleSyncAccounts = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncAccounts();
      toast({
        title: T(t, "email.accountsSynced", "Account sincronizzati"),
        description: T(t, "email.accountsSyncedDescription", "I tuoi account email sono stati sincronizzati con successo"),
      });
    } catch (error) {
      toast({
        title: T(t, "email.syncError", "Errore sincronizzazione"),
        description: T(t, "email.syncErrorDescription", "Si è verificato un errore durante la sincronizzazione degli account"),
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Formatta il nome dell'account per la visualizzazione
  const formatAccountName = (account) => {
    return (
      <div className="flex flex-col">
        <span className="font-medium">{account.name}</span>
        <span className="text-xs text-muted-foreground">{account.email}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-md border border-input px-3 py-2 text-sm">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
        {T(t, "email.loadingAccounts", "Caricamento account...")}
      </div>
    );
  }

  if (emailAccounts.length === 0) {
    return (
      <div className="border rounded-md p-2">
        <div className="text-sm text-muted-foreground mb-2">
          {T(t, "email.noAccountsMessage", "Non hai configurato nessun account email.")}
        </div>
        {onAddAccount && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddAccount}
            className="w-full"
            disabled={disabled}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {T(t, "email.addAccount", "Aggiungi account email")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          disabled={disabled || isLoading}
          value={value.toString()}
          onValueChange={(value) => onChange(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={T(t, "email.selectAccount", "Seleziona account")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{T(t, "email.yourAccounts", "I tuoi account")}</SelectLabel>
              {emailAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-muted-foreground">{account.email}</span>
                    </div>
                    {account.isPrimary && (
                      <span className="ml-auto text-primary flex items-center text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        {T(t, "email.primary", "Principale")}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          title={T(t, "email.syncAccounts", "Sincronizza account")}
          disabled={disabled || isSyncing}
          onClick={handleSyncAccounts}
        >
          <RotateCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {onAddAccount && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddAccount}
          className="w-full"
          disabled={disabled}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {T(t, "email.addAnotherAccount", "Aggiungi un altro account")}
        </Button>
      )}
    </div>
  );
}