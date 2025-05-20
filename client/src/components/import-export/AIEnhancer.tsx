import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Brain, Check, RotateCw, AlertCircle, UserCog, Building, TagIcon
} from 'lucide-react';

interface EnhancementResult {
  id: string;
  originalContact: any;
  enhancedContact: any;
  changes: {
    field: string;
    original: string | null;
    enhanced: string | null;
    confidence: number;
  }[];
  overallConfidence: number;
}

interface AIEnhancerProps {
  onApply: (enhancedData: EnhancementResult[]) => Promise<void>;
  onClose: () => void;
}

export function AIEnhancer({ onApply, onClose }: AIEnhancerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [enhancementResults, setEnhancementResults] = useState<EnhancementResult[]>([]);
  
  // Simula l'elaborazione dell'IA e la generazione di risultati
  useEffect(() => {
    // Simula un ritardo di elaborazione e aggiornamenti di progresso
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          
          // Genera risultati di esempio
          setTimeout(() => {
            generateMockResults();
            setIsProcessing(false);
          }, 500);
          
          return 100;
        }
        return prev + 5;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  // Genera risultati di esempio per la simulazione
  const generateMockResults = () => {
    const mockResults: EnhancementResult[] = [
      {
        id: '1',
        originalContact: {
          id: 'new-1',
          firstName: 'Marco',
          lastName: 'Rossi',
          email: 'marco.rossi@example.com',
          phone: '+39 123 4567890',
          title: 'sviluppatore',
          companyName: 'tech solutions srl',
          tags: ['developer']
        },
        enhancedContact: {
          id: 'new-1',
          firstName: 'Marco',
          lastName: 'Rossi',
          email: 'marco.rossi@example.com',
          phone: '+39 123 4567890',
          title: 'Sviluppatore Software Senior',
          companyName: 'Tech Solutions S.r.l.',
          tags: ['developer', 'software', 'senior']
        },
        changes: [
          {
            field: 'title',
            original: 'sviluppatore',
            enhanced: 'Sviluppatore Software Senior',
            confidence: 0.89
          },
          {
            field: 'companyName',
            original: 'tech solutions srl',
            enhanced: 'Tech Solutions S.r.l.',
            confidence: 0.95
          },
          {
            field: 'tags',
            original: 'developer',
            enhanced: 'developer, software, senior',
            confidence: 0.82
          }
        ],
        overallConfidence: 0.88
      },
      {
        id: '2',
        originalContact: {
          id: 'new-2',
          firstName: 'giulia',
          lastName: 'bianchi',
          email: 'g.bianchi@example.org',
          phone: '3897654321',
          title: 'marketing',
          companyName: 'promo italia',
          tags: []
        },
        enhancedContact: {
          id: 'new-2',
          firstName: 'Giulia',
          lastName: 'Bianchi',
          email: 'g.bianchi@example.org',
          phone: '+39 389 7654321',
          title: 'Marketing Manager',
          companyName: 'Promo Italia S.p.A.',
          tags: ['marketing', 'digital', 'management']
        },
        changes: [
          {
            field: 'firstName',
            original: 'giulia',
            enhanced: 'Giulia',
            confidence: 0.99
          },
          {
            field: 'lastName',
            original: 'bianchi',
            enhanced: 'Bianchi',
            confidence: 0.99
          },
          {
            field: 'phone',
            original: '3897654321',
            enhanced: '+39 389 7654321',
            confidence: 0.93
          },
          {
            field: 'title',
            original: 'marketing',
            enhanced: 'Marketing Manager',
            confidence: 0.78
          },
          {
            field: 'companyName',
            original: 'promo italia',
            enhanced: 'Promo Italia S.p.A.',
            confidence: 0.86
          },
          {
            field: 'tags',
            original: null,
            enhanced: 'marketing, digital, management',
            confidence: 0.75
          }
        ],
        overallConfidence: 0.88
      }
    ];
    
    setEnhancementResults(mockResults);
  };
  
  // Gestisce l'applicazione dei miglioramenti
  const handleApply = async () => {
    setIsProcessing(true);
    
    try {
      await onApply(enhancementResults);
      setIsOpen(false);
    } catch (error) {
      console.error('Errore nell\'applicazione dei miglioramenti:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Gestisce la chiusura della finestra di dialogo
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  // Ottiene il colore di sfondo in base al livello di confidenza
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.7) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            {t('ai.enhancementResults')}
          </DialogTitle>
        </DialogHeader>
        
        {isProcessing ? (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-16 w-16 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-center font-medium mb-4">{t('ai.processingData')}</h3>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-gray-500 text-center">{progress}%</p>
          </div>
        ) : (
          <>
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700">
                {t('ai.enhancementDescription', { count: enhancementResults.length })}
              </AlertDescription>
            </Alert>
            
            <ScrollArea className="h-[350px] rounded-md border p-4">
              {enhancementResults.map(result => (
                <div 
                  key={result.id} 
                  className="mb-6 pb-6 border-b last:border-b-0 last:pb-0 last:mb-0"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">
                      {result.enhancedContact.firstName} {result.enhancedContact.lastName}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(result.overallConfidence)}
                    >
                      {t('ai.confidence')}: {Math.round(result.overallConfidence * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {result.changes.map((change, index) => (
                      <div key={index} className="border rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            {change.field === 'title' && <UserCog className="h-4 w-4 mr-1 text-gray-600" />}
                            {change.field === 'companyName' && <Building className="h-4 w-4 mr-1 text-gray-600" />}
                            {change.field === 'tags' && <TagIcon className="h-4 w-4 mr-1 text-gray-600" />}
                            <span className="font-medium text-sm text-gray-700">
                              {t(`contact.${change.field}`)}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(change.confidence)}`}
                          >
                            {Math.round(change.confidence * 100)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-gray-50 p-1 rounded">
                            <span className="text-xs text-gray-500">{t('ai.original')}:</span>{' '}
                            <span className={change.original ? '' : 'italic text-gray-400'}>
                              {change.original || t('ai.noValue')}
                            </span>
                          </div>
                          <div className="bg-blue-50 p-1 rounded">
                            <span className="text-xs text-blue-500">{t('ai.enhanced')}:</span>{' '}
                            <span className="font-medium">
                              {change.enhanced}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleApply}
            disabled={isProcessing || enhancementResults.length === 0}
          >
            {isProcessing ? (
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('ai.applyEnhancements')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}