import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DuplicateAnalyzerProps {
  data: any[];
  entityType: string;
  onDuplicatesProcessed: (processedData: any[]) => void;
}

export function DuplicateAnalyzer({ 
  data,
  entityType,
  onDuplicatesProcessed
}: DuplicateAnalyzerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [threshold, setThreshold] = useState(0.7);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState('potential');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Avvia l'analisi dei duplicati
  const analyzeDuplicates = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/import/detect-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: data,
          entityType,
          threshold,
        }),
      });

      if (!response.ok) {
        throw new Error(t('importExport.duplicateAnalysisError'));
      }

      const result = await response.json();
      setDuplicates(result.duplicates || []);
      
      // Inizializza il selectedItems con tutti i duplicati selezionati
      const initialSelected: {[key: string]: boolean} = {};
      result.duplicates.forEach((group: any) => {
        group.items.forEach((item: any, index: number) => {
          if (index === 0) { // Seleziona solo il primo elemento di ogni gruppo
            initialSelected[item.id || `temp-${group.groupId}-${index}`] = true;
          }
        });
      });
      setSelectedItems(initialSelected);
      
      // Passa alla tab dei potenziali duplicati
      setActiveTab('potential');
      
      toast({
        title: t('importExport.duplicatesFound', { count: result.duplicates.length }),
        description: t('importExport.reviewDuplicatesDescription'),
      });
    } catch (error) {
      toast({
        title: t('importExport.duplicateAnalysisError'),
        description: error instanceof Error ? error.message : t('importExport.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Gestisce la selezione/deselezione di un elemento
  const toggleSelect = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Procede con i dati dopo aver gestito i duplicati
  const processDuplicates = () => {
    // Filtra i dati originali rimuovendo quelli non selezionati
    const processedData = data.filter(item => {
      const itemId = item.id || `temp-${item.tempId}`;
      // Se l'ID non è presente in selectedItems, significa che non è un duplicato
      return selectedItems[itemId] !== false;
    });

    onDuplicatesProcessed(processedData);
    
    toast({
      title: t('importExport.duplicatesProcessed'),
      description: t('importExport.dataReadyForImport'),
    });
  };

  // Rende un elemento per la revisione
  const renderItem = (item: any, index: number, groupId: string) => {
    const itemId = item.id || `temp-${groupId}-${index}`;
    
    return (
      <div 
        key={itemId} 
        className="flex items-start p-3 border-b last:border-0 hover:bg-muted/20"
      >
        <Checkbox 
          checked={selectedItems[itemId] !== false}
          onCheckedChange={() => toggleSelect(itemId)}
          className="mt-1 mr-3"
        />
        <div className="flex-1">
          <div className="font-medium">
            {entityType === 'contacts' && `${item.firstName || ''} ${item.lastName || ''}`}
            {entityType === 'companies' && item.name}
            {entityType === 'deals' && item.name}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {entityType === 'contacts' && item.email}
            {entityType === 'companies' && item.email || item.website}
            {entityType === 'deals' && `${item.value || '0'} € - ${item.status || 'n/a'}`}
          </div>
          {entityType === 'contacts' && (
            <div className="text-xs text-muted-foreground mt-1">
              {item.phone || item.mobile} {item.company && `- ${item.company}`}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('importExport.duplicateAnalysis')}</CardTitle>
        <CardDescription>
          {t('importExport.duplicateAnalysisDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {duplicates.length === 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {t('importExport.similarityThreshold')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(threshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[threshold * 100]}
                  min={50}
                  max={95}
                  step={5}
                  onValueChange={(value) => setThreshold(value[0] / 100)}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">
                  {t('importExport.thresholdDescription')}
                </span>
              </div>
              
              <Button 
                onClick={analyzeDuplicates} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing 
                  ? t('importExport.analyzingDuplicates') 
                  : t('importExport.analyzeDuplicates')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="potential">
                    {t('importExport.potentialDuplicates')}
                  </TabsTrigger>
                  <TabsTrigger value="unique">
                    {t('importExport.uniqueItems')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="potential" className="border rounded-md">
                  {duplicates.length > 0 ? (
                    <div className="divide-y">
                      {duplicates.map((group, groupIndex) => (
                        <div key={group.groupId || groupIndex} className="p-2">
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded mb-2">
                            <span className="text-sm font-medium">
                              {t('importExport.duplicateGroup', { number: groupIndex + 1 })}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                              {t('importExport.similarityScore', { score: Math.round(group.similarity * 100) })}%
                            </span>
                          </div>
                          <div className="divide-y">
                            {group.items.map((item: any, itemIndex: number) => 
                              renderItem(item, itemIndex, group.groupId || `group-${groupIndex}`)
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">
                        {t('importExport.noDuplicatesFound')}
                      </h3>
                      <p className="text-muted-foreground">
                        {t('importExport.noDuplicatesDescription')}
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="unique" className="border rounded-md">
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      {t('importExport.uniqueItemsDescription')}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDuplicates([]);
                    setSelectedItems({});
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button onClick={processDuplicates}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('importExport.processDuplicates')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}