import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImportExport } from '@/hooks/useImportExport';
import { useToast } from '@/hooks/use-toast';

interface AIEnhancerProps {
  entityType: 'contacts' | 'companies' | 'leads';
  onEnhancementComplete?: (result: any) => void;
}

export function AIEnhancer({ entityType, onEnhancementComplete }: AIEnhancerProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [enhancementType, setEnhancementType] = useState<string>('categorization');
  const { enhanceWithAI } = useImportExport();
  const { toast } = useToast();

  const handleEnhance = async () => {
    // Verificare prima se API key OpenAI è disponibile
    if (!process.env.OPENAI_API_KEY) {
      toast({
        title: 'API Key mancante',
        description: 'L\'API key di OpenAI non è configurata nel sistema.',
        variant: 'destructive',
      });
      return;
    }

    setEnhancing(true);
    try {
      const options = {
        enhancementType,
      };

      // Usiamo un'entity vuota per richiedere arricchimento di tutto il database
      // per quel tipo di entità
      const result = await enhanceWithAI({ type: entityType }, entityType, options);
      
      if (onEnhancementComplete) {
        onEnhancementComplete(result);
      }
    } catch (error) {
      console.error('Errore nell\'arricchimento con AI:', error);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Arricchimento Dati con AI</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-sm mb-2">Tipo di arricchimento:</p>
          <Select 
            value={enhancementType} 
            onValueChange={setEnhancementType}
            disabled={enhancing}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona tipo di arricchimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categorization">Categorizzazione</SelectItem>
              <SelectItem value="tagging">Suggerimento Tag</SelectItem>
              <SelectItem value="completion">Completamento Dati</SelectItem>
              <SelectItem value="all">Arricchimento Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleEnhance} disabled={enhancing}>
            {enhancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborazione in corso...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Avvia Arricchimento
              </>
            )}
          </Button>
        </div>
      </div>

      {enhancing && (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Applicazione dell'intelligenza artificiale ai dati...
          </CardContent>
        </Card>
      )}
    </div>
  );
}