import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useImportExport } from '@/hooks/useImportExport';

interface DuplicateAnalyzerProps {
  entityType: 'contacts' | 'companies' | 'leads';
  onDuplicatesFound?: (duplicates: any[]) => void;
}

export function DuplicateAnalyzer({ entityType, onDuplicatesFound }: DuplicateAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const { checkDuplicates } = useImportExport();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await checkDuplicates({ type: entityType }, entityType);
      
      if (result?.duplicates) {
        setDuplicates(result.duplicates);
        
        if (onDuplicatesFound) {
          onDuplicatesFound(result.duplicates);
        }
      }
    } catch (error) {
      console.error('Errore nell\'analisi dei duplicati:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-md font-medium">Rilevamento Duplicati</h3>
        <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            'Analizza Database'
          )}
        </Button>
      </div>

      {duplicates.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm mb-2">
            Trovati {duplicates.length} possibili duplicati.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {duplicates.map((duplicate, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm">
                  {entityType === 'contacts' && `${duplicate.firstName} ${duplicate.lastName}`}
                  {entityType === 'companies' && duplicate.name}
                  {entityType === 'leads' && duplicate.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs space-y-1">
                    {entityType === 'contacts' && (
                      <>
                        <p><span className="font-medium">Email:</span> {duplicate.email}</p>
                        <p><span className="font-medium">Telefono:</span> {duplicate.phone}</p>
                        <p><span className="font-medium">Azienda:</span> {duplicate.company}</p>
                      </>
                    )}
                    {entityType === 'companies' && (
                      <>
                        <p><span className="font-medium">Indirizzo:</span> {duplicate.address}</p>
                        <p><span className="font-medium">Telefono:</span> {duplicate.phone}</p>
                        <p><span className="font-medium">Email:</span> {duplicate.email}</p>
                      </>
                    )}
                    {entityType === 'leads' && (
                      <>
                        <p><span className="font-medium">Nome:</span> {duplicate.name}</p>
                        <p><span className="font-medium">Email:</span> {duplicate.email}</p>
                        <p><span className="font-medium">Stato:</span> {duplicate.status}</p>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : analyzing ? (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Analisi del database in corso...
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            Clicca su "Analizza Database" per verificare eventuali duplicati.
          </CardContent>
        </Card>
      )}
    </div>
  );
}