import { useState, useEffect } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { Company } from "@/types";

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
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    initialValue ? String(initialValue) : undefined
  );
  
  const { data: companies, isLoading } = useCompanies();

  // Filtra le aziende disponibili per escludere quella corrente e le sue figlie
  const availableCompanies = companies?.filter(company => 
    company.id !== currentCompanyId
  ) || [];

  const handleChange = (value: string) => {
    setSelectedValue(value);
    // Converti in numero o null se "none"
    onChange(value === "none" ? null : parseInt(value, 10));
  };

  return (
    <Select
      value={selectedValue}
      onValueChange={handleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleziona azienda parent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nessuna (Root)</SelectItem>
        {availableCompanies.map((company) => (
          <SelectItem key={company.id} value={String(company.id)}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}