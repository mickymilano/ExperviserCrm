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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  Lightbulb, 
  BadgeInfo 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AIEnhancerProps {
  data: any[];
  entityType: string;
  onDataEnriched: (enhancedData: any[]) => void;
  onSkip: () => void;
}

interface EnhancementSetting {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function AIEnhancer({
  data,
  entityType,
  onDataEnriched,
  onSkip
}: AIEnhancerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [enhancedData, setEnhancedData] = useState<any[] | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<string>("medium");
  
  // Impostazioni di miglioramento per tipo di entità
  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSetting[]>([]);
  
  // Carica le impostazioni di miglioramento in base al tipo di entità
  useEffect(() => {
    let settings: EnhancementSetting[] = [];
    
    if (entityType === 'contacts') {
      settings = [
        {
          id: 'fix-names',
          name: t('importExport.fixNames'),
          description: t('importExport.fixNamesDescription'),
          active: true
        },
        {
          id: 'detect-gender',
          name: t('importExport.detectGender'),
          description: t('importExport.detectGenderDescription'),
          active: false
        },
        {
          id: 'suggest-tags',
          name: t('importExport.suggestTags'),
          description: t('importExport.suggestTagsDescription'),
          active: true
        },
        {
          id: 'normalize-phones',
          name: t('importExport.normalizePhones'),
          description: t('importExport.normalizePhonesDescription'),
          active: true
        },
        {
          id: 'enrich-social',
          name: t('importExport.enrichSocial'),
          description: t('importExport.enrichSocialDescription'),
          active: false
        }
      ];
    } else if (entityType === 'companies') {
      settings = [
        {
          id: 'normalize-names',
          name: t('importExport.normalizeNames'),
          description: t('importExport.normalizeNamesDescription'),
          active: true
        },
        {
          id: 'detect-industry',
          name: t('importExport.detectIndustry'),
          description: t('importExport.detectIndustryDescription'),
          active: true
        },
        {
          id: 'suggest-tags',
          name: t('importExport.suggestTags'),
          description: t('importExport.suggestTagsDescription'),
          active: true
        },
        {
          id: 'enrich-web',
          name: t('importExport.enrichWeb'),
          description: t('importExport.enrichWebDescription'),
          active: false
        }
      ];
    } else if (entityType === 'deals') {
      settings = [
        {
          id: 'estimate-value',
          name: t('importExport.estimateValue'),
          description: t('importExport.estimateValueDescription'),
          active: false
        },
        {
          id: 'suggest-stage',
          name: t('importExport.suggestStage'),
          description: t('importExport.suggestStageDescription'),
          active: true
        },
        {
          id: 'suggest-tags',
          name: t('importExport.suggestTags'),
          description: t('importExport.suggestTagsDescription'),
          active: true
        }
      ];
    }
    
    setEnhancementSettings(settings);
  }, [entityType, t]);
  
  // Aggiorna lo stato di attivazione di un'impostazione di miglioramento
  const toggleEnhancementSetting = (settingId: string) => {
    setEnhancementSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === settingId 
          ? { ...setting, active: !setting.active } 
          : setting
      )
    );
  };
  
  // Avvia il processo di miglioramento dati con AI
  const startEnhancement = () => {
    setIsProcessing(true);
    
    // Controlla se l'API key di OpenAI è configurata
    const hasAPIKey = true; // Nella versione reale, controllerebbe se è disponibile l'API key
    
    if (!hasAPIKey) {
      toast({
        title: t('importExport.noAPIKey'),
        description: t('importExport.noAPIKeyDescription'),
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    // In un'implementazione reale, invieremmo i dati a un endpoint API
    // che utilizzerebbe OpenAI per elaborare i dati
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setProcessProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Simula il risultato dell'elaborazione AI
        const enhanced = simulateAIEnhancement(data, enhancementSettings, confidenceThreshold);
        setEnhancedData(enhanced);
        setIsProcessing(false);
        
        toast({
          title: t('importExport.enhancementComplete'),
          description: t('importExport.enhancementCompleteDescription'),
        });
      }
    }, 200);
  };
  
  // Funzione di simulazione del miglioramento AI
  const simulateAIEnhancement = (
    data: any[], 
    settings: EnhancementSetting[],
    threshold: string
  ): any[] => {
    // In un'implementazione reale, questi dati verrebbero elaborati da OpenAI
    return data.map(record => {
      const enhanced = { ...record };
      
      // Applica i miglioramenti in base alle impostazioni attive
      settings.forEach(setting => {
        if (!setting.active) return;
        
        if (setting.id === 'suggest-tags' && !enhanced.tags) {
          // Simula l'aggiunta di tag suggeriti
          const sampleTags = [
            'importato', 
            'da-verificare', 
            'nuovo-cliente', 
            'potenziale', 
            'lead-qualificato'
          ];
          enhanced.tags = [sampleTags[Math.floor(Math.random() * sampleTags.length)]];
        }
        
        if (setting.id === 'normalize-phones' && enhanced.phone) {
          // Simula la normalizzazione del numero di telefono
          if (!enhanced.phone.startsWith('+')) {
            enhanced.phone = '+39' + enhanced.phone.replace(/\D/g, '');
          }
        }
        
        if (setting.id === 'detect-industry' && enhanced.name && !enhanced.industry) {
          // Simula il rilevamento del settore
          const industries = ['Tecnologia', 'Finanza', 'Sanità', 'Educazione', 'Manifattura'];
          enhanced.industry = industries[Math.floor(Math.random() * industries.length)];
          enhanced._ai_confidence = { industry: 0.85 };
        }
      });
      
      // Aggiungi campo di arricchimento AI
      enhanced._enriched_by_ai = true;
      
      return enhanced;
    });
  };
  
  // Completa il processo di miglioramento
  const completeEnhancement = () => {
    if (enhancedData) {
      onDataEnriched(enhancedData);
    } else {
      onDataEnriched(data);
    }
  };
  
  // Formatta il valore di confidenza in percentuale
  const formatConfidence = (value: number): string => {
    return `${(value * 100).toFixed(0)}%`;
  };
  
  // Colore CSS per il livello di confidenza
  const getConfidenceColor = (value: number): string => {
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-amber-600';
    return 'text-red-600';
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
  
  // Numero massimo di elementi da mostrare nell'anteprima
  const MAX_PREVIEW_ITEMS = 5;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            {t('importExport.aiEnhancement')}
          </div>
        </CardTitle>
        <CardDescription>
          {t('importExport.aiEnhancementDescription', { entityType: getEntityName(entityType) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isProcessing && !enhancedData && (
          <div className="space-y-6">
            <Alert>
              <BadgeInfo className="h-4 w-4" />
              <AlertTitle>{t('importExport.aiEnhancementInfo')}</AlertTitle>
              <AlertDescription>
                {t('importExport.aiEnhancementInfoDescription')}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                {t('importExport.enhancementOptions')}
              </h3>
              
              <div className="rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="confidence-threshold">
                        {t('importExport.confidenceThreshold')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('importExport.confidenceThresholdDescription')}
                      </p>
                    </div>
                    <Select
                      value={confidenceThreshold}
                      onValueChange={setConfidenceThreshold}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={t('importExport.selectThreshold')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('importExport.lowThreshold')}</SelectItem>
                        <SelectItem value="medium">{t('importExport.mediumThreshold')}</SelectItem>
                        <SelectItem value="high">{t('importExport.highThreshold')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="divide-y">
                  {enhancementSettings.map((setting) => (
                    <div key={setting.id} className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{setting.name}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch
                        checked={setting.active}
                        onCheckedChange={() => toggleEnhancementSetting(setting.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm font-medium">
                  {t('importExport.enhancingData')}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {processProgress}%
              </span>
            </div>
            <Progress value={processProgress} className="h-2 w-full" />
            <p className="text-sm text-muted-foreground">
              {t('importExport.enhancingProgress', { current: Math.floor(data.length * processProgress / 100), total: data.length })}
            </p>
          </div>
        )}
        
        {enhancedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                {t('importExport.enhancementPreview')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('importExport.showingPreview', { count: Math.min(enhancedData.length, MAX_PREVIEW_ITEMS) })}
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {entityType === 'contacts' && (
                      <>
                        <TableHead>{t('importExport.name')}</TableHead>
                        <TableHead>{t('importExport.email')}</TableHead>
                        <TableHead>{t('importExport.phone')}</TableHead>
                        <TableHead>{t('importExport.tags')}</TableHead>
                        <TableHead>{t('importExport.aiConfidence')}</TableHead>
                      </>
                    )}
                    {entityType === 'companies' && (
                      <>
                        <TableHead>{t('importExport.name')}</TableHead>
                        <TableHead>{t('importExport.industry')}</TableHead>
                        <TableHead>{t('importExport.website')}</TableHead>
                        <TableHead>{t('importExport.tags')}</TableHead>
                        <TableHead>{t('importExport.aiConfidence')}</TableHead>
                      </>
                    )}
                    {entityType === 'deals' && (
                      <>
                        <TableHead>{t('importExport.name')}</TableHead>
                        <TableHead>{t('importExport.value')}</TableHead>
                        <TableHead>{t('importExport.stage')}</TableHead>
                        <TableHead>{t('importExport.tags')}</TableHead>
                        <TableHead>{t('importExport.aiConfidence')}</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enhancedData.slice(0, MAX_PREVIEW_ITEMS).map((record, index) => (
                    <TableRow key={index}>
                      {entityType === 'contacts' && (
                        <>
                          <TableCell>
                            {record.firstName} {record.lastName}
                          </TableCell>
                          <TableCell>{record.email}</TableCell>
                          <TableCell>{record.phone}</TableCell>
                          <TableCell>
                            {record.tags && record.tags.map((tag: string, i: number) => (
                              <span key={i} className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary mr-1 mb-1">
                                {tag}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell>
                            {record._ai_confidence ? (
                              Object.entries(record._ai_confidence).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-muted-foreground">{key}: </span>
                                  <span className={getConfidenceColor(value as number)}>
                                    {formatConfidence(value as number)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                      {entityType === 'companies' && (
                        <>
                          <TableCell>{record.name}</TableCell>
                          <TableCell>{record.industry || '-'}</TableCell>
                          <TableCell>{record.website || '-'}</TableCell>
                          <TableCell>
                            {record.tags && record.tags.map((tag: string, i: number) => (
                              <span key={i} className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary mr-1 mb-1">
                                {tag}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell>
                            {record._ai_confidence ? (
                              Object.entries(record._ai_confidence).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-muted-foreground">{key}: </span>
                                  <span className={getConfidenceColor(value as number)}>
                                    {formatConfidence(value as number)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                      {entityType === 'deals' && (
                        <>
                          <TableCell>{record.name}</TableCell>
                          <TableCell>€{record.value || '-'}</TableCell>
                          <TableCell>{record.stage || '-'}</TableCell>
                          <TableCell>
                            {record.tags && record.tags.map((tag: string, i: number) => (
                              <span key={i} className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary mr-1 mb-1">
                                {tag}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell>
                            {record._ai_confidence ? (
                              Object.entries(record._ai_confidence).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-muted-foreground">{key}: </span>
                                  <span className={getConfidenceColor(value as number)}>
                                    {formatConfidence(value as number)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onSkip}
          disabled={isProcessing}
        >
          {t('importExport.skip')}
        </Button>
        
        {!enhancedData ? (
          <Button 
            onClick={startEnhancement} 
            disabled={isProcessing || !enhancementSettings.some(s => s.active)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('importExport.startEnhancement')}
          </Button>
        ) : (
          <Button onClick={completeEnhancement}>
            {t('importExport.continue')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}