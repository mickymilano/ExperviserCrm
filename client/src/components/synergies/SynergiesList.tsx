import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Handshake, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { SynergyModal } from '../modals/SynergyModal';
import { Link } from 'wouter';
import { useContacts } from '../../hooks/useContacts';
import { useCompanies } from '../../hooks/useCompanies';
import { useDeals } from '../../hooks/useDeals';

interface SynergiesListProps {
  entityId: number;
  entityType: 'contact' | 'company' | 'deal';
  showTitle?: boolean;
}

export function SynergiesList({ 
  entityId, 
  entityType, 
  showTitle = true 
}: SynergiesListProps) {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedSynergy, setSelectedSynergy] = React.useState<any>(null);

  // Recuperare dati di contatti e aziende per mostrare i nomi invece degli ID
  const { data: contacts = [] } = useContacts();
  const { data: companies = [] } = useCompanies();
  const { data: deals = [] } = useDeals();
  
  // Costruisci l'endpoint in base al tipo di entità
  const endpoint = `/api/synergies/${entityType}/${entityId}`;
  
  console.log(`SynergiesList: fetching from ${endpoint} with entityType=${entityType}, entityId=${entityId}`);
  
  // Ottieni le sinergie
  const { data: synergies = [], isLoading, refetch, error } = useQuery({
    queryKey: [endpoint],
    enabled: !!entityId,
    retry: 1
  });
  
  console.log("SynergiesList data:", synergies, "error:", error);

  const handleOpenEdit = (synergy: any) => {
    setSelectedSynergy(synergy);
    setIsEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = () => {
    refetch();
    setIsEditModalOpen(false);
    setSelectedSynergy(null);
  };

  const getSynergyStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Inactive':
        return 'bg-gray-500';
      case 'On Hold':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Funzioni di utilità per recuperare i nomi dalle liste
  const getContactName = (contactId: number, synergy?: any) => {
    // 1. Prima controlliamo se la sinergia ha i dati di contatto inclusi (dal backend arricchito)
    if (synergy && synergy.contact) {
      return `${synergy.contact.firstName} ${synergy.contact.lastName}`;
    }
    
    // 2. Se non ci sono dati incorporati, cerchiamo nell'elenco dei contatti
    const contact = contacts.find((c: any) => c.id === contactId);
    if (contact) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    
    // 3. Fallback
    return t('synergies.contact_fallback', { id: contactId });
  };
  
  const getCompanyName = (companyId: number, synergy?: any) => {
    // 1. Prima controlliamo se la sinergia ha i dati dell'azienda inclusi
    if (synergy && synergy.company && synergy.company.name) {
      return synergy.company.name;
    }
    
    // 2. Se non ci sono dati incorporati, cerchiamo nell'elenco delle aziende
    const company = companies.find((c: any) => c.id === companyId);
    if (company) {
      return company.name;
    }
    
    // 3. Fallback
    return t('synergies.company_fallback', { id: companyId });
  };
  
  const getDealName = (dealId: number) => {
    const deal = deals.find((d: any) => d.id === dealId);
    return deal ? deal.name || t('synergies.deal_fallback', { id: dealId }) : t('synergies.deal_fallback', { id: dealId });
  };

  // Genera parametri iniziali per la creazione della sinergia in base al tipo di entità
  const getInitialParams = () => {
    if (entityType === 'contact') {
      return { contactId: entityId };
    } else if (entityType === 'company') {
      return { companyId: entityId };
    } else if (entityType === 'deal') {
      return { dealId: entityId };
    }
    return {};
  };

  // Ottieni l'URL dell'entità collegata
  const getEntityUrl = (synergy: any) => {
    if (entityType === 'contact' && synergy.companyId) {
      return `/companies/${synergy.companyId}`;
    } else if (entityType === 'company' && synergy.contactId) {
      return `/contacts/${synergy.contactId}`;
    } else if (entityType === 'deal') {
      if (synergy.contactId) return `/contacts/${synergy.contactId}`;
      if (synergy.companyId) return `/companies/${synergy.companyId}`;
    }
    return '#';
  };

  // Ottieni il nome dell'entità collegata
  const getEntityName = (synergy: any) => {
    if (entityType === 'contact' && synergy.companyId) {
      return getCompanyName(synergy.companyId, synergy);
    } else if (entityType === 'company' && synergy.contactId) {
      return getContactName(synergy.contactId, synergy);
    } else if (entityType === 'deal') {
      if (synergy.contactId) return getContactName(synergy.contactId, synergy);
      if (synergy.companyId) return getCompanyName(synergy.companyId, synergy);
    }
    return t('synergies.unknown_entity');
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Handshake className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t('synergies.title')}</h3>
          </div>
          {/* 
            DISABLED: Synergy actions only allowed in DealModal
            Il pulsante "Aggiungi" viene mostrato solo nel contesto Deal in conformità 
            con la regola di business che le sinergie possono essere create/modificate
            solo all'interno dei Deal
          */}
          {entityType === 'deal' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('common.add')}
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !Array.isArray(synergies) || synergies.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <Handshake className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="text-sm font-medium mb-2">{t('synergies.no_synergies_found')}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {entityType === 'deal' 
                ? t('synergies.no_deal_synergies')
                : t('synergies.deals_only_message')}
            </p>
            {/* Il pulsante "Crea sinergia" è stato rimosso perché la funzionalità è disabilitata.
              Le sinergie possono essere create solo nel contesto delle opportunità. */}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Array.isArray(synergies) && synergies.map((synergy: any) => (
            <Card 
              key={synergy?.id || 'no-id'} 
              className="overflow-hidden hover:shadow-sm transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="font-medium">{synergy?.type || t('synergies.unspecified_type')}</span>
                    <Badge className={`ml-2 ${getSynergyStatusColor(synergy?.status || '')}`}>
                      {synergy?.status || t('common.unknown')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {synergy?.createdAt && format(new Date(synergy.createdAt), 'dd/MM/yyyy')}
                  </div>
                </div>
                
                {synergy?.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {synergy.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-muted-foreground">
                    {t('common.id')}: {synergy?.id || t('common.not_available')}
                  </div>
                  <Link href={getEntityUrl(synergy) || '#'}>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {getEntityName(synergy)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <SynergyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        onSuccess={handleCreateSuccess}
        {...getInitialParams()}
      />

      {/* Edit Modal */}
      {selectedSynergy && (
        <SynergyModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          initialData={selectedSynergy}
          mode="edit"
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}