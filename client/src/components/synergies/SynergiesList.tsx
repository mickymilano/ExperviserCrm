import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Handshake, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SynergyModal } from '@/components/modals/SynergyModal';
import { Link } from 'wouter';
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';

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
  const getContactName = (contactId: number) => {
    const contact = contacts.find((c: any) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : `Contatto #${contactId}`;
  };
  
  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: any) => c.id === companyId);
    return company ? company.name : `Azienda #${companyId}`;
  };
  
  const getDealName = (dealId: number) => {
    const deal = deals.find((d: any) => d.id === dealId);
    return deal ? deal.title || `Deal #${dealId}` : `Deal #${dealId}`;
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
      return getCompanyName(synergy.companyId);
    } else if (entityType === 'company' && synergy.contactId) {
      return getContactName(synergy.contactId);
    } else if (entityType === 'deal') {
      if (synergy.contactId) return getContactName(synergy.contactId);
      if (synergy.companyId) return getCompanyName(synergy.companyId);
    }
    return 'Entità sconosciuta';
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Handshake className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Sinergie</h3>
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
              Aggiungi
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
            <h4 className="text-sm font-medium mb-2">Nessuna sinergia trovata</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {entityType === 'deal' 
                ? "Non ci sono ancora sinergie associate a questa trattativa."
                : "Le sinergie possono essere create solo all'interno delle trattative (Deals)."}
            </p>
            {entityType === 'deal' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crea sinergia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Array.isArray(synergies) && synergies.map((synergy: any) => (
            <Card 
              key={synergy?.id || 'no-id'} 
              className="overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleOpenEdit(synergy)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="font-medium">{synergy?.type || 'Tipo non specificato'}</span>
                    <Badge className={`ml-2 ${getSynergyStatusColor(synergy?.status || '')}`}>
                      {synergy?.status || 'Sconosciuto'}
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
                    ID: {synergy?.id || 'N/A'}
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