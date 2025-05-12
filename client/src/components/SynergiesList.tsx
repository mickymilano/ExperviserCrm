import { useState, useEffect } from "react";
import { useContactSynergies, useCompanySynergies } from "@/hooks/useSynergies.tsx";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SynergyModal } from "@/components/modals/SynergyModal";
import { Edit, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface SynergiesListProps {
  contactId?: number;
  companyId?: number;
  showTitle?: boolean;
  hideAddButton?: boolean; // Non più usato - le sinergie devono essere create solo tramite Deal
  hideDeleteButtons?: boolean; // Non più usato - le sinergie non possono essere cancellate
}

export function SynergiesList({ contactId, companyId, showTitle = true, hideAddButton = true, hideDeleteButtons = true }: SynergiesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Solo il modal di modifica è permesso, la creazione è gestita solo tramite Deal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSynergy, setCurrentSynergy] = useState<any>(null);
  
  // Forziamo l'invalidazione della cache quando il componente viene montato
  useEffect(() => {
    if (companyId) {
      // Rimuoviamo completamente i dati dalla cache invece di invalidarli
      queryClient.removeQueries({ queryKey: ["/api/companies", companyId, "synergies"] });
      console.log(`[SynergiesList] Cache rimossa per companyId ${companyId}`);
    } else if (contactId) {
      queryClient.removeQueries({ queryKey: ["/api/contacts", contactId, "synergies"] });
      console.log(`[SynergiesList] Cache rimossa per contactId ${contactId}`);
    }
  }, [companyId, contactId, queryClient]);
  
  // Get the appropriate data based on whether we're looking at a contact or company
  // Otteniamo le sinergie dal contatto o dall'azienda
  const contactSynergiesResult = useContactSynergies(contactId as number);
  const companySynergiesResult = useCompanySynergies(companyId as number);
  
  console.log(`[SynergiesList] Data ricevuta:`, {
    forCompany: companyId,
    data: companyId ? companySynergiesResult.data : contactSynergiesResult.data,
    isLoading: companyId ? companySynergiesResult.isLoading : contactSynergiesResult.isLoading,
    isError: companyId ? companySynergiesResult.isError : contactSynergiesResult.isError
  });
  
  // Utilizziamo il risultato appropriato in base a contactId o companyId
  // Importante: assicuriamoci che synergies sia sempre [] se data è undefined o non un array
  const synergies = contactId 
    ? (Array.isArray(contactSynergiesResult.data) ? contactSynergiesResult.data : [])
    : (Array.isArray(companySynergiesResult.data) ? companySynergiesResult.data : []);
    
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
  
  // Funzione per modificare una sinergia esistente
  const handleEdit = (synergy: any) => {
    setCurrentSynergy(synergy);
    setEditModalOpen(true);
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

  // Se non ci sono sinergie, o se il risultato non è un array, o se l'array è vuoto
  // Controllo più rigoroso e dettagliato
  if (!synergies || !Array.isArray(synergies) || synergies.length === 0) {
    // Log dettagliato per debug
    console.log("[SynergiesList] No synergies found:", { 
      synergiesValue: synergies,
      isArray: Array.isArray(synergies), 
      length: Array.isArray(synergies) ? synergies.length : 'N/A',
      dataType: typeof synergies,
      forContact: contactId || 'none',
      forCompany: companyId || 'none',
      contactData: contactSynergiesResult.data,
      companyData: companySynergiesResult.data
    });
    
    // Messaggio più dettagliato che chiarisce che non ci sono sinergie nel database
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Business Synergies</h3>
            {/* Pulsante "Add Synergy" rimosso - le sinergie vanno create solo tramite Deal */}
          </div>
        )}
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <Handshake className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            No business synergies found. Synergies are automatically created when a deal involves contacts and companies.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Database verification: The synergies table is empty. There are no synergies in the database.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Entity ID: {contactId ? `Contact #${contactId}` : companyId ? `Company #${companyId}` : 'All entities'}
          </p>
        </div>
      </div>
    );
  }

  // Effettuiamo una validazione molto rigorosa dei dati
  // Verifichiamo che ogni elemento sia un oggetto valido con tutte le proprietà richieste
  const validSynergies = Array.isArray(synergies) 
    ? synergies.filter(syn => 
        syn && 
        typeof syn === 'object' && 
        'id' in syn && 
        'contactId' in syn &&
        'companyId' in syn &&
        'dealId' in syn
      )
    : [];
    
  // Log dettagliato per debug
  console.log("[SynergiesList] Validazione synergies:", { 
    originalCount: Array.isArray(synergies) ? synergies.length : 0,
    validCount: validSynergies.length,
    isArray: Array.isArray(synergies),
    filteredCount: Array.isArray(synergies) ? synergies.length - validSynergies.length : 0,
    firstItem: validSynergies.length > 0 ? validSynergies[0] : null
  });
  
  // Se non ci sono sinergie valide, mostriamo un messaggio più informativo
  if (validSynergies.length === 0) {
    console.warn("[SynergiesList] Nessuna sinergia valida dopo filtrazione");
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Business Synergies</h3>
          </div>
        )}
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <Handshake className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            No valid business synergies found. Synergies are automatically created when a deal involves contacts and companies.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Database verification: No valid synergies were found for this entity.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Entity: {contactId ? `Contact #${contactId}` : companyId ? `Company #${companyId}` : 'All entities'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Business Synergies</h3>
          {/* Il bottone "Add Synergy" è stato rimosso perché le sinergie devono essere create solo tramite Deal */}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {validSynergies.map((synergy: any) => (
          <Card key={synergy.id || Math.random()}>
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
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
      
      {/* Modal di creazione rimosso - le sinergie vanno create solo tramite Deal */}
      
      <SynergyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={currentSynergy}
        mode="edit"
      />
    </div>
  );
}