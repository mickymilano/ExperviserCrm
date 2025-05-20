import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { FileUploader } from './FileUploader';
import { DuplicateAnalyzer } from './DuplicateAnalyzer';
import { AIEnhancer } from './AIEnhancer';
import { useToast } from '../../hooks/use-toast';
import { useImportExport } from '../../hooks/useImportExport';
import { 
  Download, Upload, FileText, FileSpreadsheet, AlertCircle, 
  Check, X, RotateCw, Settings, Brain
} from 'lucide-react';

/**
 * Componente principale per la gestione dell'importazione/esportazione dei contatti
 */
export function ImportExportManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [duplicatesFound, setDuplicatesFound] = useState<any[]>([]);
  const [showAIEnhancer, setShowAIEnhancer] = useState(false);
  const [importSettings, setImportSettings] = useState({
    detectDuplicates: true,
    duplicateThreshold: 75, // percentuale di somiglianza per considerare un duplicato
    skipFirstRow: true, // salta la prima riga (intestazioni)
    dateFormat: 'DD/MM/YYYY',
    useAI: false
  });

  const { 
    importContacts, 
    exportContacts, 
    analyzeDuplicates,
    enhanceWithAI
  } = useImportExport();

  // Gestisce il caricamento di un file
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    
    // Determina il formato dal tipo di file
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType === 'csv') {
      setImportFormat('csv');
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      setImportFormat('excel');
    }
    
    // Reset dello stato
    setDuplicatesFound([]);
    setProgressValue(0);
  };

  // Gestisce l'analisi dei duplicati
  const handleAnalyzeDuplicates = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      // Simulazione del progresso
      const progressInterval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      // Chiamata API per analizzare i duplicati
      const result = await analyzeDuplicates(
        selectedFile, 
        importFormat, 
        importSettings.duplicateThreshold
      );
      
      clearInterval(progressInterval);
      setProgressValue(100);
      
      if (result.duplicates.length > 0) {
        setDuplicatesFound(result.duplicates);
        toast({
          title: t('duplicateAnalysis.duplicatesFound', { count: result.duplicates.length }),
          description: t('duplicateAnalysis.pleaseReview'),
          variant: 'default'
        });
      } else {
        toast({
          title: t('duplicateAnalysis.noDuplicates'),
          description: t('duplicateAnalysis.proceedWithImport'),
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Errore nell\'analisi dei duplicati:', error);
      toast({
        title: t('duplicateAnalysis.error'),
        description: t('duplicateAnalysis.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Gestisce l'importazione dei contatti
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      // Simulazione del progresso
      const progressInterval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 2;
        });
      }, 100);
      
      // Chiamata API per importare i contatti
      const result = await importContacts(
        selectedFile, 
        importFormat, 
        importSettings
      );
      
      clearInterval(progressInterval);
      setProgressValue(100);
      
      toast({
        title: t('import.success'),
        description: t('import.successDescription', { count: result.imported }),
        variant: 'default'
      });
      
      // Reset dello stato
      setSelectedFile(null);
      setProgressValue(0);
      setDuplicatesFound([]);
      
      // Se è stata utilizzata l'AI, mostra il report di miglioramento
      if (importSettings.useAI && result.enhanced) {
        setShowAIEnhancer(true);
      }
    } catch (error) {
      console.error('Errore nell\'importazione dei contatti:', error);
      toast({
        title: t('import.error'),
        description: t('import.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Gestisce l'esportazione dei contatti
  const handleExport = async () => {
    setIsProcessing(true);
    
    try {
      // Simulazione del progresso
      const progressInterval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);
      
      // Chiamata API per esportare i contatti
      const result = await exportContacts(exportFormat);
      
      clearInterval(progressInterval);
      setProgressValue(100);
      
      // Crea un link per il download e lo clicca automaticamente
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || `contatti_export_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('export.success'),
        description: t('export.successDescription', { count: result.exported }),
        variant: 'default'
      });
    } catch (error) {
      console.error('Errore nell\'esportazione dei contatti:', error);
      toast({
        title: t('export.error'),
        description: t('export.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgressValue(0);
    }
  };

  // Gestisce l'applicazione dei miglioramenti AI
  const handleApplyAIEnhancements = async (enhancedData: any) => {
    // Implementazione da completare
    console.log('Applicazione miglioramenti AI:', enhancedData);
    setShowAIEnhancer(false);
    
    toast({
      title: t('ai.enhancementsApplied'),
      description: t('ai.enhancementsAppliedDescription'),
      variant: 'default'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('importExport.title')}</CardTitle>
        <CardDescription>{t('importExport.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              {t('importExport.import')}
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              {t('importExport.export')}
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Importazione */}
          <TabsContent value="import" className="space-y-4">
            {!selectedFile ? (
              <FileUploader 
                onFileSelected={handleFileSelected} 
                acceptedFormats=".csv,.xlsx,.xls"
              />
            ) : (
              <>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('import.fileSelected')}</AlertTitle>
                  <AlertDescription>
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>{t('import.options')}</Label>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="detectDuplicates"
                        checked={importSettings.detectDuplicates}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          detectDuplicates: e.target.checked
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="detectDuplicates" className="text-sm font-normal">
                        {t('import.detectDuplicates')}
                      </Label>
                    </div>
                    
                    {importSettings.detectDuplicates && (
                      <div className="ml-6 mt-2">
                        <Label htmlFor="duplicateThreshold" className="text-xs">
                          {t('import.similarityThreshold')}: {importSettings.duplicateThreshold}%
                        </Label>
                        <input
                          type="range"
                          id="duplicateThreshold"
                          min="50"
                          max="100"
                          value={importSettings.duplicateThreshold}
                          onChange={(e) => setImportSettings({
                            ...importSettings,
                            duplicateThreshold: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="skipFirstRow"
                        checked={importSettings.skipFirstRow}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          skipFirstRow: e.target.checked
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="skipFirstRow" className="text-sm font-normal">
                        {t('import.skipHeaderRow')}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="useAI"
                        checked={importSettings.useAI}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          useAI: e.target.checked
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="useAI" className="text-sm font-normal flex items-center">
                        <Brain className="h-4 w-4 mr-1 text-blue-500" />
                        {t('import.useAI')}
                      </Label>
                    </div>
                    
                    {importSettings.useAI && (
                      <Alert className="mt-2 bg-blue-50">
                        <AlertTitle className="text-blue-700">
                          {t('ai.howItWorks')}
                        </AlertTitle>
                        <AlertDescription className="text-blue-600 text-sm">
                          {t('ai.description')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                {duplicatesFound.length > 0 && (
                  <DuplicateAnalyzer 
                    duplicates={duplicatesFound} 
                    onResolve={(resolvedData) => {
                      console.log('Duplicati risolti:', resolvedData);
                      setDuplicatesFound([]);
                    }}
                  />
                )}
                
                {isProcessing && (
                  <div className="space-y-2 py-4">
                    <Label>{t('import.importing')}</Label>
                    <Progress value={progressValue} className="h-2" />
                    <p className="text-sm text-gray-500 text-right">{progressValue}%</p>
                  </div>
                )}
                
                <div className="flex space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setDuplicatesFound([]);
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('common.cancel')}
                  </Button>
                  
                  {importSettings.detectDuplicates && duplicatesFound.length === 0 && (
                    <Button 
                      variant="secondary"
                      onClick={handleAnalyzeDuplicates}
                      disabled={isProcessing}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {t('import.analyzeDuplicates')}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleImport}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {t('import.importContacts')}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Tab Esportazione */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('export.selectFormat')}</AlertTitle>
                <AlertDescription>
                  {t('export.formatDescription')}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    exportFormat === 'csv' ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                  onClick={() => setExportFormat('csv')}
                >
                  <FileText className="h-12 w-12 mb-2 text-primary" />
                  <h3 className="font-medium">CSV</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    {t('export.csvDescription')}
                  </p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    exportFormat === 'excel' ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                  onClick={() => setExportFormat('excel')}
                >
                  <FileSpreadsheet className="h-12 w-12 mb-2 text-green-600" />
                  <h3 className="font-medium">Excel</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    {t('export.excelDescription')}
                  </p>
                </div>
              </div>
              
              {isProcessing && (
                <div className="space-y-2 py-4">
                  <Label>{t('export.exporting')}</Label>
                  <Progress value={progressValue} className="h-2" />
                  <p className="text-sm text-gray-500 text-right">{progressValue}%</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleExport}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {t('export.exportContacts')}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Componente AI Enhancer (mostrato solo quando necessario) */}
      {showAIEnhancer && (
        <AIEnhancer 
          onApply={handleApplyAIEnhancements}
          onClose={() => setShowAIEnhancer(false)}
        />
      )}
    </Card>
  );
}