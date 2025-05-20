import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type EntityType = 'contacts' | 'companies' | 'deals';

export function useImportExport() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Importa dati nel sistema
   */
  const importData = async (data: any[], entityType: EntityType): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/import/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Errore durante l'importazione dei dati`);
      }

      const result = await response.json();
      
      toast({
        title: t('importExport.importComplete'),
        description: t('importExport.importCompleteDescription', { count: result.count || 0 }),
      });
      
      return result;
    } catch (error) {
      toast({
        title: t('importExport.importError'),
        description: error instanceof Error ? error.message : t('importExport.unknownError'),
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
      // Per esportare, facciamo una richiesta GET che scatenerà il download
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

      // Se la risposta è OK, scarichiamo il file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_export.${fileType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: t('importExport.exportComplete'),
        description: t('importExport.exportCompleteDescription'),
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: t('importExport.exportError'),
        description: error instanceof Error ? error.message : t('importExport.unknownError'),
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
    isLoading,
  };
}