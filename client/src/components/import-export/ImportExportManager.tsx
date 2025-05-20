import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { useImportExport } from '@/hooks/useImportExport';

interface ImportExportManagerProps {
  entityType: 'contacts' | 'companies' | 'leads';
  title: string;
  importTitle?: string;
  exportTitle?: string;
}

export function ImportExportManager({ entityType, title, importTitle, exportTitle }: ImportExportManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { importData, exportData } = useImportExport();

  // Gestione dell'importazione
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImport = async (fileType: 'csv' | 'excel') => {
    if (!selectedFile) return;
    
    setImporting(true);
    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const correctFileType = fileType === 'csv' ? 'csv' : 'xlsx,xls';
      
      // Verifica che il file sia del tipo corretto
      if (fileType === 'csv' && fileExtension !== 'csv') {
        throw new Error('Il file selezionato non è un file CSV');
      } else if (fileType === 'excel' && !['xlsx', 'xls'].includes(fileExtension)) {
        throw new Error('Il file selezionato non è un file Excel');
      }
      
      await importData(selectedFile, entityType, fileType);
      setSelectedFile(null);
    } catch (error) {
      console.error(`Errore durante l'importazione ${fileType}:`, error);
    } finally {
      setImporting(false);
    }
  };

  // Gestione dell'esportazione
  const handleExport = async (fileType: 'csv' | 'excel') => {
    setExporting(true);
    try {
      await exportData(entityType, fileType);
    } catch (error) {
      console.error(`Errore durante l'esportazione ${fileType}:`, error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Importazione */}
      <div>
        <h3 className="text-lg font-medium flex items-center mb-4">
          <Upload className="h-5 w-5 mr-2" />
          {importTitle || `Importa ${title}`}
        </h3>
        <Card className="p-4 border border-dashed hover:border-primary transition-colors">
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-4 h-full py-6">
            <Upload className="h-8 w-8 text-primary" />
            <h4 className="font-medium text-center">{`Carica ${title}`}</h4>
            <p className="text-sm text-center text-muted-foreground">
              Carica un file CSV o Excel con i tuoi {title.toLowerCase()}
            </p>
            <FileUploader
              onFileSelect={handleFileSelect}
              isLoading={importing}
              accept=".csv, .xlsx, .xls"
              buttonText="Seleziona File"
            />
            
            {selectedFile && (
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={() => handleImport('csv')} 
                  disabled={importing || !selectedFile.name.endsWith('.csv')}
                  size="sm"
                >
                  Importa CSV
                </Button>
                <Button 
                  onClick={() => handleImport('excel')} 
                  disabled={importing || !(selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))}
                  size="sm"
                >
                  Importa Excel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Esportazione */}
      <div>
        <h3 className="text-lg font-medium flex items-center mb-4">
          <Download className="h-5 w-5 mr-2" />
          {exportTitle || `Esporta ${title}`}
        </h3>
        <Card className="p-4">
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-4 h-full py-6">
            <Download className="h-8 w-8 text-primary" />
            <h4 className="font-medium text-center">{`Scarica ${title}`}</h4>
            <p className="text-sm text-center text-muted-foreground">
              Scarica i tuoi {title.toLowerCase()} in formato CSV o Excel
            </p>
            <div className="flex space-x-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                CSV
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}