import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type EntityType = 'contacts' | 'companies' | 'leads';
type FileType = 'csv' | 'excel';

interface UseImportExportOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useImportExport(options?: UseImportExportOptions) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Funzione per importare dati
  const importData = async (file: File, entityType: EntityType, fileType: FileType, importOptions = {}) => {
    if (!file) {
      toast({
        title: 'Errore',
        description: 'Nessun file selezionato',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (Object.keys(importOptions).length > 0) {
        formData.append('options', JSON.stringify(importOptions));
      }

      const response = await fetch(`/api/import-export/import/${fileType}/${entityType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore durante l'importazione: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: 'Importazione completata',
        description: `${result.imported} record importati con successo.`,
      });

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Errore di importazione:', error);
      
      toast({
        title: 'Errore di importazione',
        description: error.message || 'Si è verificato un errore durante l\'importazione.',
        variant: 'destructive',
      });

      if (options?.onError) {
        options.onError(error);
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Funzione per esportare dati
  const exportData = async (entityType: EntityType, fileType: FileType, ids = [], exportOptions = {}) => {
    setIsExporting(true);

    try {
      // Per il download del file, dobbiamo gestire la risposta in modo diverso
      const response = await fetch(`/api/import-export/export/${fileType}/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, options: exportOptions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore durante l'esportazione: ${response.statusText}`);
      }

      // Ottieni il blob dalla risposta
      const blob = await response.blob();
      
      // Crea un URL per il blob
      const url = window.URL.createObjectURL(blob);
      
      // Crea un elemento "a" per il download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_export.${fileType === 'csv' ? 'csv' : 'xlsx'}`;
      
      // Aggiungi l'elemento al DOM, attiva il click e rimuovilo
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Esportazione completata',
        description: `I dati sono stati esportati con successo.`,
      });

      if (options?.onSuccess) {
        options.onSuccess(true);
      }

      return true;
    } catch (error) {
      console.error('Errore di esportazione:', error);
      
      toast({
        title: 'Errore di esportazione',
        description: error.message || 'Si è verificato un errore durante l\'esportazione.',
        variant: 'destructive',
      });

      if (options?.onError) {
        options.onError(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Funzione per verificare duplicati
  const checkDuplicates = async (entity: any, entityType: EntityType, checkOptions = {}) => {
    setIsDuplicateChecking(true);

    try {
      const response = await fetch(`/api/import-export/check-duplicates/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entity, options: checkOptions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore durante la verifica dei duplicati: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.duplicates?.length > 0) {
        toast({
          title: 'Duplicati trovati',
          description: `Trovati ${result.duplicates.length} possibili duplicati.`,
        });
      } else {
        toast({
          title: 'Verifica completata',
          description: 'Nessun duplicato trovato.',
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Errore nella verifica dei duplicati:', error);
      
      toast({
        title: 'Errore nella verifica',
        description: error.message || 'Si è verificato un errore durante la verifica dei duplicati.',
        variant: 'destructive',
      });

      if (options?.onError) {
        options.onError(error);
      }
    } finally {
      setIsDuplicateChecking(false);
    }
  };

  // Funzione per migliorare i dati con AI
  const enhanceWithAI = async (entity: any, entityType: EntityType, enhanceOptions = {}) => {
    setIsEnhancing(true);

    try {
      const response = await fetch(`/api/import-export/enhance/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entity, options: enhanceOptions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore durante il miglioramento con AI: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: 'Miglioramento completato',
        description: 'I dati sono stati arricchiti con successo tramite AI.',
      });

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Errore nel miglioramento con AI:', error);
      
      toast({
        title: 'Errore nel miglioramento',
        description: error.message || 'Si è verificato un errore durante il miglioramento con AI.',
        variant: 'destructive',
      });

      if (options?.onError) {
        options.onError(error);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  return {
    importData,
    exportData,
    checkDuplicates,
    enhanceWithAI,
    isImporting,
    isExporting,
    isDuplicateChecking,
    isEnhancing
  };
}