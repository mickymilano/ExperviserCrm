import { useState, useEffect } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { Check, ChevronsUpDown, Building } from "lucide-react";
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

interface ParentCompanySelectorProps {
  initialValue?: number | null;
  currentCompanyId?: number | null;
  onChange: (value: number | null) => void;
}

export function ParentCompanySelector({ 
  initialValue, 
  currentCompanyId, 
  onChange 
}: ParentCompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(initialValue || null);
  const { data: companies, isLoading } = useCompanies();
  
  // Filtra le aziende escludendo quella corrente (per evitare cicli) e quelle che hanno come parent l'azienda corrente (per evitare cicli annidati)
  const availableCompanies = companies?.filter(company => 
    company.id !== currentCompanyId && company.parentCompanyId !== currentCompanyId
  ) || [];

  // Trova il nome dell'azienda selezionata
  const selectedCompanyName = value 
    ? availableCompanies.find(company => company.id === value)?.name || ""
    : "";

  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === "" ? null : Number(selectedValue);
    setValue(newValue);
    onChange(newValue);
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
          disabled={isLoading}
        >
          {value ? (
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              {selectedCompanyName}
            </div>
          ) : (
            "Seleziona azienda parent"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Cerca un'azienda..." />
          <CommandEmpty>Nessuna azienda trovata.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="empty"
              value=""
              onSelect={() => handleSelect("")}
              className="text-muted-foreground"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              Nessuna azienda parent
            </CommandItem>

            {availableCompanies.map((company) => (
              <CommandItem
                key={company.id}
                value={company.id.toString()}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === company.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}