import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { usePipelineStages } from "../../hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import DealModal from "../../components/modals/DealModal";
import { Skeleton } from "../../components/ui/skeleton";
import { DealInfo } from "../../types";

export default function NewDeal() {
  const [_, navigate] = useLocation();
  const [showModal, setShowModal] = useState(true);
  const { data: stages, isLoading: isLoadingStages } = usePipelineStages();
  
  // Ottieni i parametri dalla query URL
  const params = new URLSearchParams(window.location.search);
  const contactId = params.get("contactId");
  const companyId = params.get("companyId");
  
  // Prepara un oggetto di default con valori predefiniti
  // Questo è sicuro rispetto alla tipizzazione e sarà gestito da DealModal
  const defaultValues = {
    name: "",
    value: 0,
    stageId: stages && stages.length > 0 ? stages[0].id : 0,
    contactId: contactId ? parseInt(contactId) : undefined,
    companyId: companyId ? parseInt(companyId) : undefined,
    notes: "",
    tags: [],
    expectedCloseDate: ""
  };
  
  // Quando il modale viene chiuso, torna alla pagina precedente
  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      // Se c'è contactId, torna alla pagina del contatto
      if (contactId) {
        navigate(`/contacts/${contactId}`);
      } 
      // Se c'è companyId, torna alla pagina dell'azienda
      else if (companyId) {
        navigate(`/companies/${companyId}`);
      } 
      // Altrimenti torna alla lista dei deal
      else {
        navigate("/deals");
      }
    }
  };
  
  // Se è in caricamento, mostra uno skeleton
  if (isLoadingStages) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/deals")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/deals")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create New Deal</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Deal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Fill out the form to create a new deal.
          </p>
        </CardContent>
      </Card>
      
      <DealModal
        open={showModal}
        onOpenChange={handleModalClose}
        // Il componente DealModal accetta qualsiasi oggetto valido per i campi del form
        initialData={defaultValues}
      />
    </div>
  );
}