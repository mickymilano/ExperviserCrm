import { useState } from "react";
import { useLocation } from "wouter";
import { Handshake, Plus, Filter, RefreshCw, User, Building, DollarSign, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SynergyModal } from "@/components/modals/SynergyModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function SynergiesPage() {
  // DISABLED: Synergy actions only allowed in DealModal
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSynergy, setEditingSynergy] = useState<any>(null);
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  
  // Recuperare dati di contatti e aziende per mostrare i nomi invece degli ID
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ['/api/contacts'],
  });
  
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/companies'],
  });
  
  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ['/api/deals'],
  });
  
  const { data: synergies = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/synergies'],
  });

  // Funzioni di utilità per recuperare i nomi dalle liste
  const getContactName = (contactId: number) => {
    const contact = contacts.find((c: any) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : t('synergies.contact_fallback', { id: contactId });
  };
  
  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: any) => c.id === companyId);
    return company ? company.name : t('synergies.company_fallback', { id: companyId });
  };
  
  const getDealName = (dealId: number) => {
    const deal = deals.find((d: any) => d.id === dealId);
    return deal ? deal.name || t('synergies.deal_fallback', { id: dealId }) : t('synergies.deal_fallback', { id: dealId });
  };

  const handleEditSynergy = (synergy: any) => {
    // DISABLED: Synergy actions only allowed in DealModal
    // Permettiamo solo la visualizzazione, non l'editing
    setEditingSynergy(synergy);
  };

  const handleCloseEditModal = () => {
    setEditingSynergy(null);
  };

  const getSynergyStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-500";
      case "Inactive":
        return "bg-gray-500";
      case "On Hold":
        return "bg-blue-500";
      case "Completed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Handshake className="h-8 w-8 mr-2" />
            {t('synergies.page_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('synergies.manage_business_relationships')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('synergies.refresh')}
          </Button>
          {/* DISABLED: Synergy actions only allowed in DealModal
          <Button 
            size="sm" 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Synergy
          </Button>
          */}
        </div>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : synergies && synergies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {synergies.map((synergy: any) => (
            <Card 
              key={synergy.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEditSynergy(synergy)}
            >
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{synergy.type}</CardTitle>
                  <Badge className={getSynergyStatusColor(synergy.status)}>
                    {synergy.status}
                  </Badge>
                </div>
                <CardDescription>
                  {t('synergies.id', { id: synergy.id })} • {t('synergies.created_on', { date: format(new Date(synergy.createdAt), 'dd/MM/yyyy') })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {/* Informazioni principali in evidenza */}
                <div className="grid grid-cols-3 gap-2 mb-4 bg-muted/20 p-2 rounded">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('synergies.contact')}</p>
                    <p className="text-sm font-medium">{getContactName(synergy.contactId)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('synergies.deal')}</p>
                    <p className="text-sm font-medium">{synergy.dealId ? getDealName(synergy.dealId) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('synergies.start_date')}</p>
                    <p className="text-sm font-medium">{synergy.startDate ? format(new Date(synergy.startDate), 'dd/MM/yyyy') : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('synergies.description')}</p>
                  <p className="text-sm">
                    {synergy.description || t('synergies.no_description')}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">{t('synergies.contact')}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contacts/${synergy.contactId}`);
                      }}
                    >
                      <User className="h-3 w-3 mr-1" />
                      {getContactName(synergy.contactId)}
                    </Button>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">{t('synergies.company')}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/companies/${synergy.companyId}`);
                      }}
                    >
                      <Building className="h-3 w-3 mr-1" />
                      {getCompanyName(synergy.companyId)}
                    </Button>
                  </div>
                </div>
                {synergy.dealId && (
                  <div className="mt-2">
                    <p className="text-muted-foreground mb-1 text-sm">{t('synergies.associated_opportunity')}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Creiamo una funzione di navigazione più sicura che verifichi prima l'esistenza del deal
                        const deal = deals.find(d => d.id === synergy.dealId);
                        if (deal) {
                          console.log("Navigando al deal esistente:", deal);
                          navigate(`/deals/${synergy.dealId}`);
                        } else {
                          console.error("Deal non trovato con ID:", synergy.dealId);
                          // Mostriamo un messaggio all'utente
                          alert(t('synergies.deal_not_found_error'));
                        }
                      }}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {getDealName(synergy.dealId)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Handshake className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">{t('synergies.none_found_title')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('synergies.none_found_description')}
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/deals')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {t('synergies.go_to_opportunities')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DISABLED: Synergy actions only allowed in DealModal
      <SynergyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        onSuccess={() => refetch()}
      />
      */}

      {/* 
        Edit Synergy Modal trasformato in ReadOnly
        Cambiato da "edit" a "view" per mostrare in sola lettura in conformità con
        la regola di business che le sinergie possono essere modificate solo nel contesto Deal
      */}
      {editingSynergy && (
        <SynergyModal
          open={!!editingSynergy}
          onOpenChange={handleCloseEditModal}
          initialData={editingSynergy}
          mode="view"
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}