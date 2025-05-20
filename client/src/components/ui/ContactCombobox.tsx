import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = React.useState("");

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

  // Filtra i contatti in base alla ricerca
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const name = getContactName(contact).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

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
      <PopoverContent className="w-full p-2">
        <div className="flex items-center border rounded-md px-3 mb-2">
          <Search className="h-4 w-4 mr-2 opacity-50" />
          <Input 
            className="flex h-9 w-full rounded-md border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Cerca contatto..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div 
                key={contact.id} 
                className="px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center rounded-md"
                onClick={() => handleSelectContact(contact.id.toString(), contact)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === contact.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{getContactName(contact)}</div>
                  <div className="flex text-xs text-muted-foreground mt-1">
                    {contact.jobTitle && <span>{contact.jobTitle}</span>}
                    {contact.company?.name && (
                      <span className={contact.jobTitle ? "ml-1" : ""}>
                        {contact.jobTitle ? " • " : ""}{contact.company.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}