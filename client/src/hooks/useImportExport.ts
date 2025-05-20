import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

type EntityType = 'contacts' | 'companies' | 'leads';

interface ImportExportHook {
  importData: (file: File, entityType: EntityType, fileType: 'csv' | 'excel') => Promise<any>;
  exportData: (entityType: EntityType, fileType: 'csv' | 'excel') => Promise<any>;
  checkDuplicates: (entity: any, entityType: EntityType) => Promise<any>;
  enhanceWithAI: (entity: any, entityType: EntityType, options?: any) => Promise<any>;
  isLoading: boolean;
}

export function useImportExport(): ImportExportHook {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Importa dati da un file nel sistema
   */
  const importData = async (file: File, entityType: EntityType, fileType: 'csv' | 'excel'): Promise<any> => {
    setIsLoading(true);
    try {
      // Creiamo un FormData per l'upload del file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('fileType', fileType);

      // Inviamo la richiesta al backend
      const response = await fetch(`/api/import/${entityType}/${fileType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Errore durante l'importazione dei dati`);
      }

      const result = await response.json();
      
      toast({
        title: 'Importazione completata',
        description: `${result.count || 0} elementi importati con successo`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Errore di importazione',
        description: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'importazione',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Esporta dati dal sistema in un file CSV o Excel
   */
  const exportData = async (entityType: EntityType, fileType: 'csv' | 'excel'): Promise<any> => {
    setIsLoading(true);
    try {
      // Per esportare, facciamo una richiesta GET con un link che scatenerà il download
      const response = await fetch(`/api/export/${entityType}/${fileType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Errore durante l'esportazione dei dati`);
      }

      // Otteniamo il blob dal server
      const blob = await response.blob();
      
      // Determiniamo l'estensione del file
      const extension = fileType === 'csv' ? 'csv' : 'xlsx';
      
      // Creiamo un URL per il blob e lo scarichiamo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Esportazione completata',
        description: `I dati sono stati esportati in formato ${fileType.toUpperCase()}`,
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: 'Errore di esportazione',
        description: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'esportazione',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Controlla i duplicati per l'entità specificata
   */
  const checkDuplicates = async (entity: any, entityType: EntityType): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/duplicates/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entity),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Errore durante l'analisi dei duplicati`);
      }

      const result = await response.json();

      toast({
        title: 'Analisi completata',
        description: `Trovati ${result.duplicates?.length || 0} possibili duplicati`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Errore nell\'analisi dei duplicati',
        description: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'analisi',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Arricchisce i dati con l'intelligenza artificiale
   */
  const enhanceWithAI = async (entity: any, entityType: EntityType, options?: any): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enhance/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entity, options }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Errore durante l'arricchimento dei dati`);
      }

      const result = await response.json();

      toast({
        title: 'Arricchimento completato',
        description: `${result.count || 0} elementi sono stati arricchiti con successo`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Errore nell\'arricchimento dei dati',
        description: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'arricchimento',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    importData,
    exportData,
    checkDuplicates,
    enhanceWithAI,
    isLoading,
  };
}