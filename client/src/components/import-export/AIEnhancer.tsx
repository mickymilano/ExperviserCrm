import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIEnhancerProps {
  data: any[];
  entityType: string;
  onDataEnriched: (enhancedData: any[]) => void;
  onSkip: () => void;
}

export function AIEnhancer({
  data,
  entityType,
  onDataEnriched,
  onSkip,
}: AIEnhancerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedEnhancement, setSelectedEnhancement] = useState<string>('tagging');
  const [enhancedData, setEnhancedData] = useState<any[] | null>(null);

  const enhancementOptions = [
    {
      id: 'tagging',
      title: t('importExport.aiTagging'),
      description: t('importExport.aiTaggingDescription'),
      badge: t('importExport.recommended'),
    },
    {
      id: 'categorization',
      title: t('importExport.aiCategorization'),
      description: t('importExport.aiCategorizationDescription'),
    },
    {
      id: 'enrichment',
      title: t('importExport.aiEnrichment'),
      description: t('importExport.aiEnrichmentDescription'),
    },
  ];

  // Avvia l'arricchimento dei dati con AI
  const enhanceData = async () => {
    setIsEnriching(true);
    try {
      const response = await fetch('/api/import/enhance-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: data,
          enhancementType: selectedEnhancement,
        }),
      });

      if (!response.ok) {
        throw new Error(t('importExport.aiEnhancementError'));
      }

      const result = await response.json();
      setEnhancedData(result.enhancedData || data);
      
      toast({
        title: t('importExport.aiEnhancementComplete'),
        description: t('importExport.aiEnhancementCompleteDescription'),
      });
    } catch (error) {
      toast({
        title: t('importExport.aiEnhancementError'),
        description: error instanceof Error ? error.message : t('importExport.unknownError'),
        variant: 'destructive',
      });
      // In caso di errore, utilizziamo i dati originali
      setEnhancedData(data);
    } finally {
      setIsEnriching(false);
    }
  };

  // Conferma l'utilizzo dei dati arricchiti
  const confirmEnhancedData = () => {
    if (enhancedData) {
      onDataEnriched(enhancedData);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
            {t('importExport.aiEnhancer')}
          </div>
        </CardTitle>
        <CardDescription>
          {t('importExport.aiEnhancerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!enhancedData ? (
          <div className="space-y-6">
            <Tabs 
              defaultValue={selectedEnhancement}
              onValueChange={setSelectedEnhancement}
            >
              <TabsList className="w-full grid grid-cols-3">
                {enhancementOptions.map(option => (
                  <TabsTrigger key={option.id} value={option.id}>
                    {option.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {enhancementOptions.map(option => (
                <TabsContent key={option.id} value={option.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    {option.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {option.id === 'tagging' && (
                    <div className="bg-muted/30 p-3 rounded-md text-sm">
                      <p className="font-medium mb-2">{t('importExport.aiTaggingSample')}</p>
                      <ul className="space-y-1">
                        <li>• {t('importExport.aiTaggingSample1')}</li>
                        <li>• {t('importExport.aiTaggingSample2')}</li>
                        <li>• {t('importExport.aiTaggingSample3')}</li>
                      </ul>
                    </div>
                  )}
                  
                  {option.id === 'categorization' && (
                    <div className="bg-muted/30 p-3 rounded-md text-sm">
                      <p className="font-medium mb-2">{t('importExport.aiCategorizationSample')}</p>
                      <ul className="space-y-1">
                        <li>• {t('importExport.aiCategorizationSample1')}</li>
                        <li>• {t('importExport.aiCategorizationSample2')}</li>
                      </ul>
                    </div>
                  )}
                  
                  {option.id === 'enrichment' && (
                    <div className="bg-muted/30 p-3 rounded-md text-sm">
                      <p className="font-medium mb-2">{t('importExport.aiEnrichmentSample')}</p>
                      <ul className="space-y-1">
                        <li>• {t('importExport.aiEnrichmentSample1')}</li>
                        <li>• {t('importExport.aiEnrichmentSample2')}</li>
                      </ul>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={onSkip}
              >
                {t('importExport.skipAiEnhancement')}
              </Button>
              <Button 
                onClick={enhanceData}
                disabled={isEnriching}
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('importExport.enhancingData')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('importExport.enhanceWithAi')}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/20">
              <p className="text-sm mb-3">
                {t('importExport.aiCompleteSummary', { count: enhancedData.length })}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <Check className="h-3 w-3 mr-1" />
                  {t('importExport.aiCompleteSuccess')}
                </Badge>
                {selectedEnhancement === 'tagging' && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    {t('importExport.tagsAdded')}
                  </Badge>
                )}
                {selectedEnhancement === 'categorization' && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    {t('importExport.categoriesAdded')}
                  </Badge>
                )}
                {selectedEnhancement === 'enrichment' && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    {t('importExport.dataEnriched')}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEnhancedData(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button onClick={confirmEnhancedData}>
                <Check className="h-4 w-4 mr-2" />
                {t('importExport.useEnhancedData')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}