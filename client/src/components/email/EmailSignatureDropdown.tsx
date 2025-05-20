import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { T } from '@/lib/translationHelper';

interface EmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault?: boolean;
}

interface EmailSignatureDropdownProps {
  signatures: EmailSignature[];
  onSelectSignature: (id: number, content: string) => void;
  disabled?: boolean;
  triggerLabel?: string;
}

export function EmailSignatureDropdown({ 
  signatures, 
  onSelectSignature, 
  disabled = false, 
  triggerLabel 
}: EmailSignatureDropdownProps) {
  const { t } = useTranslation();

  // Se non ci sono firme, nascondi il componente
  if (signatures.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <PenLine className="h-4 w-4 mr-1" />
          {triggerLabel || T(t, 'email.signature', 'Firma')}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {T(t, 'email.selectSignature', 'Seleziona firma')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {signatures.map((signature) => (
          <DropdownMenuItem
            key={signature.id}
            onClick={() => onSelectSignature(signature.id, signature.content)}
            className="flex justify-between items-center"
          >
            <span>{signature.name}</span>
            {signature.isDefault && (
              <span className="text-xs text-muted-foreground">
                {T(t, 'email.default', 'Predefinita')}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}