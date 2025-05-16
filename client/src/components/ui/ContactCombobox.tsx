import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Contact } from "@/types";

interface ContactComboboxProps {
  contacts: Contact[];
  value: string;
  onChange: (value: string, contact?: Contact) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function ContactCombobox({
  contacts,
  value,
  onChange,
  placeholder = "Seleziona un contatto...",
  emptyMessage = "Nessun contatto trovato.",
  disabled = false,
}: ContactComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const getContactName = (contact: Contact) => {
    return `${contact.firstName} ${contact.lastName}`;
  };

  const getSelectedContactName = () => {
    if (!value) return "";
    
    const selectedContact = contacts.find(
      (contact) => contact.id.toString() === value
    );
    return selectedContact ? getContactName(selectedContact) : "";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? getSelectedContactName() : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Cerca contatto..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                value={getContactName(contact)}
                onSelect={() => {
                  const newValue = contact.id.toString();
                  onChange(newValue, contact);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === contact.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                {getContactName(contact)}
                {contact.jobTitle && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({contact.jobTitle})
                  </span>
                )}
                {contact.company?.name && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {contact.jobTitle ? "" : "("}{contact.company.name}{contact.jobTitle ? "" : ")"}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}