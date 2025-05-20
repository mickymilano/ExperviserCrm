import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileUploader } from './FileUploader';
import { DuplicateAnalyzer } from './DuplicateAnalyzer';
import { AIEnhancer } from './AIEnhancer';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileType } from 'lucide-react';
import { useImportExport } from '@/hooks/useImportExport';

export function ImportExportManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { importData, exportData, isLoading } = useImportExport();
  
  // Stati generali
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  // Utilizziamo un tipo più specifico per entityType
  const [entityType, setEntityType] = useState<'contacts' | 'companies' | 'deals'>('contacts');
  const [fileFormat, setFileFormat] = useState<'csv' | 'excel'>('csv');
  
  // Stati per il flusso di importazione
  const [importStep, setImportStep] = useState<'upload' | 'duplicates' | 'ai' | 'confirm'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  
  // Gestisce la selezione di un file da importare
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    
    // Simula la lettura e parsing del file
    if (file) {
      // Nella versione reale, qui chiameremmo un'API per caricare e analizzare il file
      setTimeout(() => {
        const mockData = Array.from({ length: 10 }, (_, i) => ({
          id: `temp-${i}`,
          firstName: `Nome${i}`,
          lastName: `Cognome${i}`,
          email: `utente${i}@example.com`,
          phone: `+3934912345${i}`,
          company: i % 3 === 0 ? 'Azienda Test' : `Azienda ${i}`,
          tags: ['importato'],
        }));
        
        setParsedData(mockData);
        setImportStep('duplicates');
      }, 1000);
    }
  };
  
  // Gestisce il completamento dell'analisi dei duplicati
  const handleDuplicatesProcessed = (data: any[]) => {
    setProcessedData(data);
    setImportStep('ai');
  };
  
  // Gestisce il completamento dell'arricchimento con AI
  const handleDataEnriched = (data: any[]) => {
    setProcessedData(data);
    setImportStep('confirm');
  };
  
  // Salta la fase di arricchimento AI
  const skipAI = () => {
    setImportStep('confirm');
  };
  
  // Conferma l'importazione finale
  const confirmImport = async () => {
    if (!processedData) {
      // Se non abbiamo dati processati, usa i dati originali (parsati)
      setProcessedData(parsedData);
    }
    
    try {
      await importData(processedData || [], entityType);
      
      // Reset del flusso dopo il completamento
      setSelectedFile(null);
      setParsedData(null);
      setProcessedData(null);
      setImportStep('upload');
      
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
    }
  };
  
  // Avvia l'esportazione dei dati
  const handleExport = async () => {
    try {
      await exportData(entityType, fileFormat);
      
      toast({
        title: t('importExport.exportStarted'),
        description: t('importExport.exportStartedDescription'),
      });
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
    }
  };
  
  // Utility per ottenere la descrizione del tipo di entità
  const getEntityDescription = (type: string): string => {
    switch (type) {
      case 'contacts':
        return t('importExport.contactsDescription');
      case 'companies':
        return t('importExport.companiesDescription');
      case 'deals':
        return t('importExport.dealsDescription');
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(v) => setActiveTab(v as 'import' | 'export')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('importExport.import')}
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('importExport.export')}
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Importazione */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('importExport.importTitle')}</CardTitle>
              <CardDescription>
                {t('importExport.importDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entity-type">
                    {t('importExport.selectEntityType')}
                  </Label>
                  <Select 
                    value={entityType}
                    onValueChange={(value) => setEntityType(value as 'contacts' | 'companies' | 'deals')}
                    disabled={importStep !== 'upload'}
                  >
                    <SelectTrigger id="entity-type" className="mt-1">
                      <SelectValue placeholder={t('importExport.selectEntityType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">{t('nav.contacts')}</SelectItem>
                      <SelectItem value="companies">{t('nav.companies')}</SelectItem>
                      <SelectItem value="deals">{t('nav.deals')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getEntityDescription(entityType)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Step 1: Caricamento File */}
          {importStep === 'upload' && (
            <FileUploader 
              onFileUploaded={handleFileSelected}
              supportedFormats={['.csv', '.xlsx', '.xls']}
            />
          )}
          
          {/* Step 2: Analisi Duplicati */}
          {importStep === 'duplicates' && parsedData && (
            <DuplicateAnalyzer
              data={parsedData}
              entityType={entityType}
              onDuplicatesProcessed={handleDuplicatesProcessed}
            />
          )}
          
          {/* Step 3: Arricchimento AI */}
          {importStep === 'ai' && processedData && (
            <AIEnhancer
              data={processedData}
              entityType={entityType}
              onDataEnriched={handleDataEnriched}
              onSkip={skipAI}
            />
          )}
          
          {/* Step 4: Conferma Importazione */}
          {importStep === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('importExport.confirmImport')}</CardTitle>
                <CardDescription>
                  {t('importExport.confirmImportDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-md mb-4">
                  <p className="mb-2">
                    <span className="font-medium">{t('importExport.summary')}</span>
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="text-muted-foreground">{t('importExport.entityType')}:</span> {t(`nav.${entityType}`)}
                    </li>
                    <li>
                      <span className="text-muted-foreground">{t('importExport.fileName')}:</span> {selectedFile?.name}
                    </li>
                    <li>
                      <span className="text-muted-foreground">{t('importExport.recordCount')}:</span> {processedData?.length || parsedData?.length || 0}
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setImportStep('upload')}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={confirmImport}
                  disabled={isLoading}
                >
                  {t('importExport.startImport')}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Tab Esportazione */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('importExport.exportTitle')}</CardTitle>
              <CardDescription>
                {t('importExport.exportDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="export-entity-type">
                    {t('importExport.selectEntityType')}
                  </Label>
                  <Select 
                    value={entityType}
                    onValueChange={(value) => setEntityType(value as 'contacts' | 'companies' | 'deals')}
                  >
                    <SelectTrigger id="export-entity-type" className="mt-1">
                      <SelectValue placeholder={t('importExport.selectEntityType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">{t('nav.contacts')}</SelectItem>
                      <SelectItem value="companies">{t('nav.companies')}</SelectItem>
                      <SelectItem value="deals">{t('nav.deals')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div>
                  <Label>{t('importExport.fileFormat')}</Label>
                  <RadioGroup 
                    value={fileFormat} 
                    onValueChange={(v) => setFileFormat(v as 'csv' | 'excel')}
                    className="mt-2 grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem 
                        value="csv" 
                        id="format-csv"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="format-csv"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <FileType className="mb-3 h-6 w-6" />
                        <div className="font-semibold">CSV</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('importExport.csvDescription')}
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem 
                        value="excel" 
                        id="format-excel"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="format-excel"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <FileType className="mb-3 h-6 w-6" />
                        <div className="font-semibold">Excel</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('importExport.excelDescription')}
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleExport} 
                className="w-full"
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('importExport.exportData')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}