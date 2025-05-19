import { useState } from "react";
import { useTranslation } from "react-i18next";
import { T } from "@/lib/translationHelper";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";

interface EmailAccountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function EmailAccountSelector({ value, onChange, disabled = false }: EmailAccountSelectorProps) {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useEmailAccounts();
  
  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={T(t, "email.loadingAccounts", "Caricamento account...")} />
        </SelectTrigger>
      </Select>
    );
  }
  
  if (!accounts || accounts.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={T(t, "email.noAccountsConfigured", "Nessun account configurato")} />
        </SelectTrigger>
      </Select>
    );
  }
  
  return (
    <Select 
      value={value.toString()} 
      onValueChange={(val) => onChange(parseInt(val, 10))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={T(t, "email.selectAccount", "Seleziona account")} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map(account => (
          <SelectItem key={account.id} value={account.id.toString()}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Mail className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>{account.name || account.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}