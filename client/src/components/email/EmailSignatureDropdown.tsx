import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { T } from '@/lib/translationHelper';

export interface EmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
}

interface EmailSignatureDropdownProps {
  signatures: EmailSignature[];
  selectedSignatureId: number | null;
  onSelect: (signature: EmailSignature) => void;
  onCreateNew: () => void;
  onEdit: (signature: EmailSignature) => void;
}

export default function EmailSignatureDropdown({
  signatures,
  selectedSignatureId,
  onSelect,
  onCreateNew,
  onEdit,
}: EmailSignatureDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedSignature = signatures.find(sig => sig.id === selectedSignatureId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedSignature ? (
            <span>{selectedSignature.name}</span>
          ) : (
            <span>{T(t, "email.selectSignature", "Seleziona firma")}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={T(t, "email.searchSignatures", "Cerca firme...")} 
          />
          <CommandList>
            <CommandEmpty>
              {T(t, "email.noSignatures", "Nessuna firma trovata")}
            </CommandEmpty>
            <CommandGroup heading={T(t, "email.signatures", "Firme email")}>
              {signatures.map((signature) => (
                <CommandItem
                  key={signature.id}
                  value={signature.name}
                  onSelect={() => {
                    onSelect(signature);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSignatureId === signature.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{signature.name}</span>
                      {signature.isDefault && (
                        <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {T(t, "email.default", "Predefinita")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(signature);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onCreateNew();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {T(t, "email.createSignature", "Crea nuova firma")}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}