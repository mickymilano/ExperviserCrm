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

  // Funzione separata per gestire la selezione di un contatto
  const handleSelectContact = (contactId: string, selectedContact: Contact) => {
    console.log("Contatto selezionato:", selectedContact, "con ID:", contactId);
    onChange(contactId, selectedContact);
    setOpen(false);
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
          onClick={() => setOpen(!open)}
        >
          {value ? getSelectedContactName() : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Cerca contatto..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                value={getContactName(contact).toLowerCase()}
                onSelect={() => handleSelectContact(contact.id.toString(), contact)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === contact.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <div onClick={() => handleSelectContact(contact.id.toString(), contact)} className="flex-1">
                  <span>{getContactName(contact)}</span>
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
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}