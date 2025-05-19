import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEmailAccounts, type EmailAccount } from '@/hooks/useEmailAccounts';
import { T } from '@/lib/translationHelper';

interface EmailAccountSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function EmailAccountSelector({
  value,
  onChange
}: EmailAccountSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: accounts = [], isLoading } = useEmailAccounts();
  
  // Trova l'account selezionato in base all'ID
  const selectedAccount = accounts.find(account => account.id === value);
  
  // Se non c'è un account selezionato e ci sono account disponibili, seleziona il primo
  useEffect(() => {
    if (!selectedAccount && accounts.length > 0 && !isLoading) {
      onChange(accounts[0].id);
    }
  }, [selectedAccount, accounts, isLoading, onChange]);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <span>{T(t, "email.loading", "Caricamento...")}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  if (accounts.length === 0) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <span>{T(t, "email.noAccounts", "Nessun account disponibile")}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedAccount ? (
            <span>{selectedAccount.name} ({selectedAccount.email})</span>
          ) : (
            <span>{T(t, "email.selectAccount", "Seleziona account")}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput 
            placeholder={T(t, "email.searchAccounts", "Cerca account...")} 
          />
          <CommandEmpty>
            {T(t, "email.noAccounts", "Nessun account trovato")}
          </CommandEmpty>
          <CommandGroup>
            {accounts.map((account: EmailAccount) => (
              <CommandItem
                key={account.id}
                value={account.id.toString()}
                onSelect={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === account.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {account.name} ({account.email})
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}