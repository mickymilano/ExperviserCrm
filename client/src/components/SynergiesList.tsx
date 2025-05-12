import { useState } from "react";
import { useContactSynergies, useCompanySynergies, useDeleteSynergy } from "@/hooks/useSynergies";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SynergyModal } from "@/components/modals/SynergyModal";
import { PlusCircle, Edit, Trash2, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface SynergiesListProps {
  contactId?: number;
  companyId?: number;
  showTitle?: boolean;
  hideAddButton?: boolean;
  hideDeleteButtons?: boolean;
}

export function SynergiesList({ contactId, companyId, showTitle = true, hideAddButton = false, hideDeleteButtons = false }: SynergiesListProps) {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSynergy, setCurrentSynergy] = useState<any>(null);
  
  // Get the appropriate data based on whether we're looking at a contact or company
  // Otteniamo le sinergie dal contatto o dall'azienda
  const contactSynergiesResult = useContactSynergies(contactId as number);
  const companySynergiesResult = useCompanySynergies(companyId as number);
  
  // Utilizziamo il risultato appropriato in base a contactId o companyId
  const synergies = contactId 
    ? contactSynergiesResult.data || []
    : companySynergiesResult.data || [];
    
  const isLoading = contactId 
    ? contactSynergiesResult.isLoading 
    : companySynergiesResult.isLoading;
    
  const isError = contactId 
    ? contactSynergiesResult.isError 
    : companySynergiesResult.isError;
    
  // Ottieni i dati necessari da altri hook
  const contactsResult = useContacts();
  const contacts = contactsResult.contacts || [];
  
  const companiesResult = useCompanies();
  const companies = companiesResult.companies || [];
  
  const dealsResult = useDeals();
  const deals = dealsResult.deals || [];
  
  const deleteMutation = useDeleteSynergy();
  
  const handleEdit = (synergy: any) => {
    setCurrentSynergy(synergy);
    setEditModalOpen(true);
  };
  
  const handleDelete = async (synergy: any) => {
    try {
      await deleteMutation.mutateAsync({
        id: synergy.id,
        contactId: synergy.contactId,
        companyId: synergy.companyId
      });
      
      toast({
        title: "Success",
        description: "Synergy deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting synergy:", error);
      toast({
        title: "Error",
        description: "Failed to delete synergy",
        variant: "destructive",
      });
    }
  };
  
  const getContactName = (id: number) => {
    if (!id) return "Contatto rimosso";
    
    // Verifica se i contatti sono stati caricati correttamente
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return `Contatto #${id}`; // Non abbiamo dati di contatti
    }
    
    const contact = contacts.find((c: any) => c.id === id);
    
    // Se troviamo il contatto, restituisci nome e cognome
    if (contact && contact.firstName) {
      return `${contact.firstName} ${contact.lastName || ''}`.trim();
    }
    
    // Se non troviamo il contatto, fai una richiesta specifica per questo contatto
    // per ottenere i dettagli aggiornati - in una versione futura questo potrebbe
    // essere implementato con una richiesta asincrona
    return `Contatto #${id}`;
  };
  
  const getCompanyName = (id: number) => {
    if (!id) return "Azienda rimossa";
    
    // Verifica se le aziende sono state caricate correttamente
    if (!Array.isArray(companies) || companies.length === 0) {
      return `Azienda #${id}`; // Non abbiamo dati di aziende
    }
    
    const company = companies.find((c: any) => c.id === id);
    
    // Se troviamo l'azienda, restituisci il nome
    if (company && company.name) {
      return company.name;
    }
    
    // Se non troviamo l'azienda, restituisci ID
    return `Azienda #${id}`;
  };
  
  const getDealName = (id: number) => {
    if (!id) return "-";
    
    // Verifica se gli affari sono stati caricati correttamente
    if (!Array.isArray(deals) || deals.length === 0) {
      return `Affare #${id}`; // Non abbiamo dati degli affari
    }
    
    const deal = deals.find((d: any) => d.id === id);
    
    // Se troviamo l'affare, restituisci il nome
    if (deal && deal.name) {
      return deal.name;
    }
    
    // Se non troviamo l'affare, restituisci ID
    return `Affare #${id}`;
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Inactive":
        return "secondary";
      case "Pending":
        return "outline";
      case "On Hold":
        return "destructive";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading synergies...</div>;
  }

  if (isError) {
    return <div className="text-red-500 p-4">Error loading synergies.</div>;
  }

  if (!Array.isArray(synergies) || synergies.length === 0) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Business Synergies</h3>
            {!hideAddButton && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCreateModalOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Synergy
              </Button>
            )}
          </div>
        )}
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <Handshake className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No business synergies found.</p>
          {!hideAddButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setCreateModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Synergy
            </Button>
          )}
        </div>
        
        {!hideAddButton && (
          <SynergyModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            contactId={contactId}
            companyId={companyId}
            mode="create"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Business Synergies</h3>
          {!hideAddButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCreateModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Synergy
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(synergies) && synergies.map((synergy: any) => (
          <Card key={synergy.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{synergy.type || 'Business'} Relationship</CardTitle>
                  <CardDescription>
                    {contactId 
                      ? `With ${getCompanyName(synergy.companyId)}` 
                      : `With ${getContactName(synergy.contactId)}`
                    }
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(synergy.status)}>
                  {synergy.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {synergy.description && (
                <p className="text-sm text-gray-600 mb-3">{synergy.description}</p>
              )}
              <div className="text-xs text-muted-foreground flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>
                    {synergy.startDate 
                      ? format(new Date(synergy.startDate), "MMM d, yyyy") 
                      : "Unknown"
                    }
                  </span>
                </div>
                {synergy.dealId && (
                  <div className="flex justify-between">
                    <span>Related Deal:</span>
                    <span>{getDealName(synergy.dealId)}</span>
                  </div>
                )}
              </div>
            </CardContent>
            {!hideDeleteButtons && (
              <CardFooter className="py-2 flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEdit(synergy)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Synergy</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this business synergy? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(synergy)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
      
      {!hideAddButton && (
        <SynergyModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          contactId={contactId}
          companyId={companyId}
          mode="create"
        />
      )}
      
      <SynergyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={currentSynergy}
        mode="edit"
      />
    </div>
  );
}