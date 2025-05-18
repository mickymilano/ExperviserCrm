import React from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Control, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

// Tipo per rappresentare un contatto selezionabile nelle sinergie
interface Contact {
  id: number;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface SynergiesSelectProps {
  contacts: Contact[];
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  className?: string;
}

// Componente per selezionare contatti multipli per sinergie
export function SynergiesSelect({
  contacts,
  control,
  name,
  label,
  placeholder,
  className,
}: SynergiesSelectProps) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          // Prepara un array di id se non esiste
          const selectedContactIds = field.value || [];
          
          // Trova i contatti completi in base agli ID selezionati
          const selectedContacts = selectedContactIds
            .map((id: number) => contacts.find((contact) => contact.id === id))
            .filter(Boolean);
          
          // Formatta il nome completo di un contatto
          const getContactFullName = (contact: Contact) => {
            return `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact';
          };

          return (
            <div className="space-y-2">
              <Select
                onValueChange={(value) => {
                  const contactId = parseInt(value, 10);
                  const isSelected = selectedContactIds.includes(contactId);
                  
                  const newSelectedIds = isSelected
                    ? selectedContactIds.filter((id: number) => id !== contactId)
                    : [...selectedContactIds, contactId];
                  
                  field.onChange(newSelectedIds);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder}>
                    {selectedContactIds.length > 0
                      ? `${selectedContactIds.length} contatti selezionati`
                      : placeholder}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contacts.length > 0 ? (
                    contacts.map((contact) => {
                      const isSelected = selectedContactIds.includes(contact.id);
                      return (
                        <SelectItem 
                          key={contact.id} 
                          value={contact.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span>{getContactFullName(contact)}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-contacts" disabled>
                      Nessun contatto disponibile
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedContacts.map((contact: Contact) => (
                    <Badge
                      key={contact.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-1"
                    >
                      {getContactFullName(contact)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          field.onChange(
                            selectedContactIds.filter((id: number) => id !== contact.id)
                          );
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}