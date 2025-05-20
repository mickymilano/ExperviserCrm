import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { queryClient } from '../lib/queryClient';

type EntityType = 'contacts' | 'companies' | 'deals';
type FileFormat = 'csv' | 'excel';

interface ImportOptions {
  detectDuplicates: boolean;
  duplicateThreshold: number;
  skipFirstRow: boolean;
  dateFormat: string;
  useAI: boolean;
}

/**
 * Hook per gestire l'importazione e l'esportazione dei dati
 */
export function useImportExport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Importa contatti da un file
   */
  const importContacts = async (
    file: File,
    format: FileFormat,
    options: ImportOptions
  ): Promise<{ imported: number; enhanced?: boolean }> => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('options', JSON.stringify(options));
      
      const response = await fetch('/api/import-export/contacts/import', {
        method: 'POST',
        body: formData,
        // Non includere Content-Type, verrà impostato automaticamente per FormData
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'importazione dei contatti: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Invalida le query dei contatti per aggiornare la UI
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
      return {
        imported: result.importedCount,
        enhanced: options.useAI && result.enhancedCount > 0
      };
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Esporta contatti in un file
   */
  const exportContacts = async (format: FileFormat): Promise<{
    blob: Blob;
    filename: string;
    exported: number;
  }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/import-export/contacts/export?format=${format}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'esportazione dei contatti: ${response.statusText}`);
      }
      
      // Ottiene il nome del file dall'header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `contacts_export.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Converti la risposta in un Blob
      const blob = await response.blob();
      
      // Ottieni il conteggio dei contatti esportati
      const countHeader = response.headers.get('X-Exported-Count');
      const exportedCount = countHeader ? parseInt(countHeader, 10) : 0;
      
      return {
        blob,
        filename,
        exported: exportedCount
      };
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analizza un file per rilevare duplicati
   */
  const analyzeDuplicates = async (
    file: File,
    format: FileFormat,
    similarityThreshold: number
  ): Promise<{
    duplicates: any[];
    totalPotentialDuplicates: number;
  }> => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('similarityThreshold', similarityThreshold.toString());
      
      const response = await fetch('/api/import-export/contacts/analyze-duplicates', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'analisi dei duplicati: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore durante l\'analisi dei duplicati:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Migliora i dati con l'IA
   */
  const enhanceWithAI = async (
    data: any[]
  ): Promise<{
    enhancedData: any[];
    enhancementStats: {
      totalEnhanced: number;
      fieldsEnhanced: Record<string, number>;
    };
  }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/import-export/ai/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore nel miglioramento dei dati con IA: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore durante il miglioramento IA:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Importazione generica di dati
   */
  const importData = async (data: any[], entityType: EntityType): Promise<any> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/import-export/${entityType}/import-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'importazione dei dati: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Invalida le query dell'entità per aggiornare la UI
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}`] });
      
      return result;
    } catch (error) {
      console.error('Errore durante l\'importazione dei dati:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Esportazione generica di dati
   */
  const exportData = async (entityType: EntityType, fileType: FileFormat): Promise<any> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/import-export/${entityType}/export-data?format=${fileType}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'esportazione dei dati: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return {
        blob,
        filename: `${entityType}_export.${fileType}`,
      };
    } catch (error) {
      console.error('Errore durante l\'esportazione dei dati:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    importContacts,
    exportContacts,
    analyzeDuplicates,
    enhanceWithAI,
    importData,
    exportData,
    isLoading
  };
}