import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, ArrowRight, Eye, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadModal from "@/components/modals/LeadModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function LeadsPage() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [_, navigate] = useLocation();
  const { t } = useTranslation();
  
  const { data: leads = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('lead.title')}</h1>
        <Button onClick={() => setShowLeadModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('lead.addLead')}
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t('lead.tabs.all')}</TabsTrigger>
          <TabsTrigger value="new">{t('lead.tabs.new')}</TabsTrigger>
          <TabsTrigger value="qualified">{t('lead.tabs.qualified')}</TabsTrigger>
          <TabsTrigger value="unqualified">{t('lead.tabs.unqualified')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
            
            {!isLoading && leads?.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <p className="text-neutral-medium mb-4">Nessun lead trovato</p>
                <Button onClick={() => setShowLeadModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi il tuo primo Lead
                </Button>
              </div>
            )}
            
            {!isLoading && leads?.map((lead) => (
              <Card key={lead.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {`${lead.firstName || ''} ${lead.lastName || ''}`}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {lead.source || t('lead.noSource')} · {lead.status || t('lead.newStatus')}
                  </p>
                </CardHeader>
                <CardContent className="pb-2">
                  {/* Mostro sempre l'azienda come prima informazione */}
                  <div className="flex items-center text-sm mb-1 font-medium">
                    <span>{lead.company || t('lead.noCompany')}</span>
                  </div>
                  
                  {(lead.email || lead.companyEmail || lead.privateEmail) && (
                    <div className="flex items-center text-sm mb-1">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span>{lead.email || lead.companyEmail || lead.privateEmail}</span>
                    </div>
                  )}
                  {(lead.phone || lead.mobilePhone || lead.officePhone) && (
                    <div className="flex items-center text-sm mb-1">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span>{lead.phone || lead.mobilePhone || lead.officePhone}</span>
                    </div>
                  )}
                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.tags.map((tag: string, i: number) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto" 
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('lead.view')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="new">
          <div className="text-center py-12 text-neutral-medium">
            Filtro per nuovi lead
          </div>
        </TabsContent>
        
        <TabsContent value="qualified">
          <div className="text-center py-12 text-neutral-medium">
            Filtro per lead qualificati
          </div>
        </TabsContent>
        
        <TabsContent value="unqualified">
          <div className="text-center py-12 text-neutral-medium">
            Filtro per lead non qualificati
          </div>
        </TabsContent>
      </Tabs>
      
      <LeadModal
        open={showLeadModal}
        onOpenChange={setShowLeadModal}
      />
    </div>
  );
}