import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DuplicateAnalyzerProps {
  data: any[];
  entityType: string;
  onDuplicatesProcessed: (processedData: any[]) => void;
}

interface DuplicateGroup {
  primaryRecord: any;
  duplicates: any[];
  similarityScore: number;
}

export function DuplicateAnalyzer({ 
  data, 
  entityType, 
  onDuplicatesProcessed 
}: DuplicateAnalyzerProps) {
  const { t } = useTranslation();
  
  const [analyzingState, setAnalyzingState] = useState<'idle' | 'analyzing' | 'completed'>('idle');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<{ [id: string]: boolean }>({});
  const [actionMode, setActionMode] = useState<'keep-all' | 'resolve-manually' | 'auto-merge'>('keep-all');
  
  // Simula l'analisi dei duplicati
  useEffect(() => {
    if (analyzingState === 'idle') {
      setAnalyzingState('analyzing');
      
      // In una versione reale, qui invieremmo una richiesta API per analizzare i duplicati
      // Per esempio, utilizzeremmo un algoritmo di fuzzy matching per confrontare record
      
      // Simuliamo un'analisi progressiva
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setAnalyzingProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Genera gruppi di duplicati di esempio
          // In una versione reale, questi verrebbero restituiti dall'API
          const mockDuplicateGroups: DuplicateGroup[] = generateMockDuplicateGroups(data);
          
          setDuplicateGroups(mockDuplicateGroups);
          setAnalyzingState('completed');
          
          // Pre-seleziona i record primari
          const initialSelection: { [id: string]: boolean } = {};
          mockDuplicateGroups.forEach(group => {
            initialSelection[group.primaryRecord.id] = true;
          });
          setSelectedRecords(initialSelection);
        }
      }, 300);
      
      return () => clearInterval(interval);
    }
  }, [analyzingState, data]);
  
  // Funzione per simulare la generazione di gruppi di duplicati
  const generateMockDuplicateGroups = (data: any[]): DuplicateGroup[] => {
    // In una versione reale, questa logica sarebbe sul server
    const groups: DuplicateGroup[] = [];
    
    // Un esempio semplice per simulare duplicati
    // Raggruppiamo per email simili per i contatti, per nome per le aziende, ecc.
    if (data.length > 5) {
      // Prendiamo i primi 2-3 elementi e creiamo un gruppo
      const primaryRecord = data[0];
      const duplicates = data.slice(1, 3);
      
      groups.push({
        primaryRecord,
        duplicates,
        similarityScore: 0.85
      });
      
      // Se ci sono abbastanza elementi, creiamo un secondo gruppo
      if (data.length > 8) {
        const primaryRecord2 = data[4];
        const duplicates2 = data.slice(5, 7);
        
        groups.push({
          primaryRecord: primaryRecord2,
          duplicates: duplicates2,
          similarityScore: 0.75
        });
      }
    }
    
    return groups;
  };
  
  // Gestione cambio selezione record
  const handleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      const updated = { ...prev };
      
      if (updated[recordId]) {
        delete updated[recordId];
      } else {
        updated[recordId] = true;
      }
      
      return updated;
    });
  };
  
  // Gestione azione di risoluzione duplicati
  const handleDuplicateResolution = () => {
    // Se non ci sono duplicati, passa semplicemente i dati originali
    if (duplicateGroups.length === 0) {
      onDuplicatesProcessed(data);
      return;
    }
    
    let processedData: any[] = [];
    
    if (actionMode === 'keep-all') {
      // Mantieni tutti i record, eliminando solo quelli non selezionati
      processedData = data.filter(record => {
        // Controlla se il record fa parte di un gruppo di duplicati
        for (const group of duplicateGroups) {
          // Se è un record primario non selezionato, salta
          if (group.primaryRecord.id === record.id && !selectedRecords[record.id]) {
            return false;
          }
          
          // Se è un duplicato e non è selezionato, salta
          if (group.duplicates.some(dup => dup.id === record.id) && !selectedRecords[record.id]) {
            return false;
          }
        }
        
        // Se non fa parte di nessun gruppo di duplicati o è selezionato, mantieni
        return true;
      });
    } else if (actionMode === 'auto-merge') {
      // Mantieni solo i record primari selezionati, scartando i duplicati
      processedData = data.filter(record => {
        // Se non fa parte di nessun gruppo di duplicati, mantieni
        let isPartOfDuplicateGroup = false;
        
        for (const group of duplicateGroups) {
          // Se è un record primario selezionato, mantieni
          if (group.primaryRecord.id === record.id && selectedRecords[record.id]) {
            return true;
          }
          
          // Se è un duplicato, segnala che fa parte di un gruppo
          if (group.duplicates.some(dup => dup.id === record.id)) {
            isPartOfDuplicateGroup = true;
          }
        }
        
        // Se non fa parte di nessun gruppo, mantieni
        return !isPartOfDuplicateGroup;
      });
    } else {
      // Risoluzione manuale: mantieni solo i record selezionati esplicitamente
      processedData = data.filter(record => selectedRecords[record.id]);
    }
    
    onDuplicatesProcessed(processedData);
  };
  
  // Restituisce il nome dell'entità in base al tipo
  const getEntityName = (type: string): string => {
    switch (type) {
      case 'contacts':
        return t('importExport.contactEntityName');
      case 'companies':
        return t('importExport.companyEntityName');
      case 'deals':
        return t('importExport.dealEntityName');
      default:
        return type;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('importExport.duplicateAnalysis')}</CardTitle>
        <CardDescription>
          {t('importExport.duplicateAnalysisDescription', { entityType: getEntityName(entityType) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analyzingState === 'analyzing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t('importExport.analyzingData')}
              </span>
              <span className="text-sm text-muted-foreground">
                {analyzingProgress}%
              </span>
            </div>
            <Progress value={analyzingProgress} className="h-2 w-full" />
          </div>
        )}
        
        {analyzingState === 'completed' && (
          <>
            {duplicateGroups.length === 0 ? (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('importExport.noDuplicatesFound')}</AlertTitle>
                <AlertDescription>
                  {t('importExport.noDuplicatesFoundDescription')}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="mb-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {t('importExport.duplicatesFoundTitle', { count: duplicateGroups.length })}
                    </AlertTitle>
                    <AlertDescription>
                      {t('importExport.duplicatesFoundDescription')}
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {t('importExport.potentialDuplicates')}
                  </h3>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        {actionMode === 'keep-all' && t('importExport.keepAllRecords')}
                        {actionMode === 'resolve-manually' && t('importExport.resolveManually')}
                        {actionMode === 'auto-merge' && t('importExport.autoMergeDuplicates')}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActionMode('keep-all')}>
                        {t('importExport.keepAllRecords')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionMode('resolve-manually')}>
                        {t('importExport.resolveManually')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionMode('auto-merge')}>
                        {t('importExport.autoMergeDuplicates')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {duplicateGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-6 border rounded-lg">
                    <div className="bg-muted/40 p-3 rounded-t-lg border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">
                          {t('importExport.duplicateGroup', { index: groupIndex + 1 })}
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {t('importExport.similarityScore')}: {(group.similarityScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">{t('importExport.select')}</TableHead>
                          <TableHead className="w-12">{t('importExport.status')}</TableHead>
                          {entityType === 'contacts' && (
                            <>
                              <TableHead>{t('importExport.name')}</TableHead>
                              <TableHead>{t('importExport.email')}</TableHead>
                              <TableHead>{t('importExport.phone')}</TableHead>
                              <TableHead>{t('importExport.company')}</TableHead>
                            </>
                          )}
                          {entityType === 'companies' && (
                            <>
                              <TableHead>{t('importExport.name')}</TableHead>
                              <TableHead>{t('importExport.location')}</TableHead>
                              <TableHead>{t('importExport.website')}</TableHead>
                              <TableHead>{t('importExport.industry')}</TableHead>
                            </>
                          )}
                          {entityType === 'deals' && (
                            <>
                              <TableHead>{t('importExport.name')}</TableHead>
                              <TableHead>{t('importExport.value')}</TableHead>
                              <TableHead>{t('importExport.stage')}</TableHead>
                              <TableHead>{t('importExport.company')}</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Record primario */}
                        <TableRow>
                          <TableCell>
                            <Checkbox 
                              checked={!!selectedRecords[group.primaryRecord.id]} 
                              onCheckedChange={() => handleRecordSelection(group.primaryRecord.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium inline-block">
                              {t('importExport.primary')}
                            </div>
                          </TableCell>
                          {entityType === 'contacts' && (
                            <>
                              <TableCell>
                                {group.primaryRecord.firstName} {group.primaryRecord.lastName}
                              </TableCell>
                              <TableCell>{group.primaryRecord.email}</TableCell>
                              <TableCell>{group.primaryRecord.phone}</TableCell>
                              <TableCell>{group.primaryRecord.company}</TableCell>
                            </>
                          )}
                          {entityType === 'companies' && (
                            <>
                              <TableCell>{group.primaryRecord.name}</TableCell>
                              <TableCell>{group.primaryRecord.location}</TableCell>
                              <TableCell>{group.primaryRecord.website}</TableCell>
                              <TableCell>{group.primaryRecord.industry}</TableCell>
                            </>
                          )}
                          {entityType === 'deals' && (
                            <>
                              <TableCell>{group.primaryRecord.name}</TableCell>
                              <TableCell>{group.primaryRecord.value}</TableCell>
                              <TableCell>{group.primaryRecord.stage}</TableCell>
                              <TableCell>{group.primaryRecord.company}</TableCell>
                            </>
                          )}
                        </TableRow>
                        
                        {/* Record duplicati */}
                        {group.duplicates.map((duplicate, dupIndex) => (
                          <TableRow key={dupIndex}>
                            <TableCell>
                              <Checkbox 
                                checked={!!selectedRecords[duplicate.id]} 
                                onCheckedChange={() => handleRecordSelection(duplicate.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 font-medium inline-block">
                                {t('importExport.duplicate')}
                              </div>
                            </TableCell>
                            {entityType === 'contacts' && (
                              <>
                                <TableCell>
                                  {duplicate.firstName} {duplicate.lastName}
                                </TableCell>
                                <TableCell>{duplicate.email}</TableCell>
                                <TableCell>{duplicate.phone}</TableCell>
                                <TableCell>{duplicate.company}</TableCell>
                              </>
                            )}
                            {entityType === 'companies' && (
                              <>
                                <TableCell>{duplicate.name}</TableCell>
                                <TableCell>{duplicate.location}</TableCell>
                                <TableCell>{duplicate.website}</TableCell>
                                <TableCell>{duplicate.industry}</TableCell>
                              </>
                            )}
                            {entityType === 'deals' && (
                              <>
                                <TableCell>{duplicate.name}</TableCell>
                                <TableCell>{duplicate.value}</TableCell>
                                <TableCell>{duplicate.stage}</TableCell>
                                <TableCell>{duplicate.company}</TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {analyzingState === 'completed' && 
            t('importExport.recordsToImport', { 
              count: Object.keys(selectedRecords).length 
            })
          }
        </div>
        <Button 
          onClick={handleDuplicateResolution}
          disabled={analyzingState !== 'completed'}
        >
          {t('importExport.continue')}
        </Button>
      </CardFooter>
    </Card>
  );
}