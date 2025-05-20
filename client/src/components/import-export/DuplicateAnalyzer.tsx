import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, UserCheck, UserX, Check, X, Users, Percent
} from 'lucide-react';

interface DuplicatePair {
  id: string;
  existingContact: any;
  newContact: any;
  similarityScore: number;
  resolution?: 'keep-existing' | 'use-new' | 'merge' | 'keep-both';
}

interface DuplicateAnalyzerProps {
  duplicates: DuplicatePair[];
  onResolve: (resolvedData: {
    duplicates: DuplicatePair[];
    totalResolved: number;
  }) => void;
}

export function DuplicateAnalyzer({ duplicates, onResolve }: DuplicateAnalyzerProps) {
  const { t } = useTranslation();
  const [resolvedDuplicates, setResolvedDuplicates] = useState<DuplicatePair[]>(duplicates);
  
  // Aggiorna la risoluzione di un duplicato
  const handleResolutionChange = (id: string, resolution: 'keep-existing' | 'use-new' | 'merge' | 'keep-both') => {
    setResolvedDuplicates(prev => 
      prev.map(dup => 
        dup.id === id ? { ...dup, resolution } : dup
      )
    );
  };
  
  // Applica la stessa risoluzione a tutti i duplicati
  const applyToAll = (resolution: 'keep-existing' | 'use-new' | 'merge' | 'keep-both') => {
    setResolvedDuplicates(prev => 
      prev.map(dup => ({ ...dup, resolution }))
    );
  };
  
  // Controlla se tutti i duplicati hanno una risoluzione
  const allResolved = resolvedDuplicates.every(dup => dup.resolution);
  
  // Completa l'analisi e passa i risultati
  const handleComplete = () => {
    onResolve({
      duplicates: resolvedDuplicates,
      totalResolved: resolvedDuplicates.filter(dup => dup.resolution).length
    });
  };
  
  // Formatta un campo di indirizzo completo
  const formatAddress = (contact: any) => {
    const parts = [];
    if (contact.address) parts.push(contact.address);
    if (contact.city) parts.push(contact.city);
    if (contact.postalCode) parts.push(contact.postalCode);
    if (contact.region) parts.push(contact.region);
    if (contact.country) parts.push(contact.country);
    
    return parts.join(', ') || t('common.notAvailable');
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-orange-800">
          <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
          {t('duplicateAnalysis.title', { count: duplicates.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-orange-100 border-orange-200">
          <AlertDescription className="text-orange-800">
            {t('duplicateAnalysis.description')}
          </AlertDescription>
        </Alert>
        
        <div className="mb-4 flex space-x-2 justify-end">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => applyToAll('keep-existing')}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            {t('duplicateAnalysis.keepExistingAll')}
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => applyToAll('use-new')}
          >
            <UserX className="h-4 w-4 mr-1" />
            {t('duplicateAnalysis.useNewAll')}
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => applyToAll('merge')}
          >
            <Users className="h-4 w-4 mr-1" />
            {t('duplicateAnalysis.mergeAll')}
          </Button>
        </div>
        
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {resolvedDuplicates.map(duplicate => (
            <div 
              key={duplicate.id} 
              className="mb-6 pb-6 border-b last:border-b-0 last:pb-0 last:mb-0"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h3 className="font-medium">{t('duplicateAnalysis.similarContact')}</h3>
                  <Badge 
                    variant="outline" 
                    className="ml-2 bg-orange-100 text-orange-800 border-orange-200"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {duplicate.similarityScore}%
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={duplicate.resolution === 'keep-existing' ? 'default' : 'outline'}
                    onClick={() => handleResolutionChange(duplicate.id, 'keep-existing')}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    {t('duplicateAnalysis.keepExisting')}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={duplicate.resolution === 'use-new' ? 'default' : 'outline'}
                    onClick={() => handleResolutionChange(duplicate.id, 'use-new')}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    {t('duplicateAnalysis.useNew')}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={duplicate.resolution === 'merge' ? 'default' : 'outline'}
                    onClick={() => handleResolutionChange(duplicate.id, 'merge')}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {t('duplicateAnalysis.merge')}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={duplicate.resolution === 'keep-both' ? 'default' : 'outline'}
                    onClick={() => handleResolutionChange(duplicate.id, 'keep-both')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t('duplicateAnalysis.keepBoth')}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded p-3">
                  <h4 className="font-medium text-sm mb-2">{t('duplicateAnalysis.existingContact')}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.name')}:</span>{' '}
                      {duplicate.existingContact.firstName} {duplicate.existingContact.lastName}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.email')}:</span>{' '}
                      {duplicate.existingContact.email || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.phone')}:</span>{' '}
                      {duplicate.existingContact.phone || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.company')}:</span>{' '}
                      {duplicate.existingContact.companyName || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.address')}:</span>{' '}
                      {formatAddress(duplicate.existingContact)}
                    </div>
                  </div>
                </div>
                
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">{t('duplicateAnalysis.newContact')}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.name')}:</span>{' '}
                      {duplicate.newContact.firstName} {duplicate.newContact.lastName}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.email')}:</span>{' '}
                      {duplicate.newContact.email || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.phone')}:</span>{' '}
                      {duplicate.newContact.phone || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.company')}:</span>{' '}
                      {duplicate.newContact.companyName || t('common.notAvailable')}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">{t('contact.address')}:</span>{' '}
                      {formatAddress(duplicate.newContact)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleComplete}
            disabled={!allResolved}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('duplicateAnalysis.applyResolutions')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}