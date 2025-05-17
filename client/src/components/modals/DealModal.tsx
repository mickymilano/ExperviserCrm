import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// Definizione dei tipi per gestire i dati nel componente
interface DealInfo {
  id?: number;
  name: string;
  value: number;
  stageId?: number;
  companyId?: number | null;
  contactId?: number | null;
  expectedCloseDate?: string;
  tags?: string[] | null;
  notes?: string | null;
  status?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface Company {
  id: number;
  name: string;
  [key: string]: any;
}

interface Contact {
  id: number;
  firstName?: string;
  lastName?: string;
  areasOfActivity?: Array<{companyId: number}>;
  [key: string]: any;
}
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useCreateSynergy } from "@/hooks/useSynergies"; // Funzionalità sinergie ripristinata
import { Badge } from "@/components/ui/badge";
import AsyncSelect from "react-select/async";
import { SynergiesSelect } from "@/components/ui/SynergiesSelect";

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DealInfo | Partial<DealInfo> | null;
}

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  stageId: z.coerce.number(),
  companyId: z.coerce.number().optional().nullable(),
  contactId: z.coerce.number().optional().nullable(),
  expectedCloseDate: z.string().optional(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
  synergyContactIds: z.array(z.number()).optional()
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [synergyContacts, setSynergyContacts] = useState<any[]>([]);
  // Stato locale per l'ID dell'azienda selezionata
  const [companyId, setCompanyId] = useState<number | null>(initialData?.companyId || null);
  const formInitializedRef = useRef(false);
  
  // Form reference for alert dialog submission
  const formRef = useRef<HTMLFormElement>(null);

  const [showNoCompanyAlert, setShowNoCompanyAlert] = useState(false);
  const [showNoContactAlert, setShowNoContactAlert] = useState(false);
  const isEditMode = !!initialData && initialData.id !== undefined;

  // Hook per la creazione di sinergie  
  const createSynergyMutation = useCreateSynergy();

  // Fetch pipeline stages 
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/pipeline-stages"],
    enabled: open,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open
  });

  useEffect(() => {
    if (Array.isArray(companies) && companies.length > 0) {
      console.log("Companies loaded:", companies.length);
      setFilteredCompanies(companies);
    }
  }, [companies]);

  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts?includeAreas=true"],
    enabled: open
  });

  useEffect(() => {
    if (Array.isArray(contacts) && contacts.length > 0) {
      console.log("Contacts loaded:", contacts.length);
    }
  }, [contacts]);

  // Query per recuperare le sinergie esistenti quando siamo in modalità di modifica
  const { data: dealSynergies = [] } = useQuery({
    queryKey: [`/api/deals/${initialData?.id}/synergies`],
    enabled: open && isEditMode && initialData?.id !== undefined,
    staleTime: Infinity
  });
  
  // Aggiorniamo i contatti sinergici quando cambia companyId
  useEffect(() => {
    if (!contacts || !Array.isArray(contacts)) return;
    
    // Se non c'è un'azienda selezionata, non filtrare
    if (!companyId) {
      setSynergyContacts([]);
      return;
    }
    
    // Filtriamo per ottenere solo i contatti che NON appartengono all'azienda selezionata
    const filtered = contacts.filter(contact => {
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        return true; // Se non ha aree di attività, includi
      }
      
      // Includi solo se NON appartiene all'azienda selezionata
      return !contact.areasOfActivity.some(area => {
        const areaCompanyId = typeof area.companyId === 'number' ? 
          area.companyId : 
          parseInt(String(area.companyId || 0));
        
        return areaCompanyId === companyId;
      });
    });
    
    setSynergyContacts(filtered);
    console.log(`Filtrati ${filtered.length} contatti sinergici (non associati all'azienda ${companyId})`);
  }, [companyId, contacts]);

  const { register, handleSubmit, reset, setValue, getValues, control, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      value: 0,
      stageId: undefined,
      companyId: undefined,
      contactId: undefined,
      expectedCloseDate: "",
      tags: [],
      notes: "",
      synergyContactIds: []
    }
  });

  // Helper function che utilizza direttamente i valori del form
  // Aggiungiamo controlli più rigorosi
  const getSelectedCompanyId = () => {
    const value = getValues("companyId");
    return typeof value === 'number' && !isNaN(value) ? value : null;
  };
  
  // Funzione per aggiornare l'azienda nel form
  const setCompanyIdInForm = (id: number | null) => {
    console.log("Setting company ID in form:", id);
    setValue("companyId", id);
    
    // Aggiorniamo i contatti filtrati
    if (!contacts || !Array.isArray(contacts)) {
      console.warn("Contacts data is not available or not an array");
      setFilteredContacts([]);
      return;
    }
    
    // Se non c'è un'azienda selezionata, svuotiamo la lista
    if (!id) {
      setFilteredContacts([]);
      return;
    }
    
    // Filtriamo i contatti per mostrare solo quelli dell'azienda selezionata
    const filtered = contacts.filter(contact => {
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
        return contact.areasOfActivity.some(area => {
          const areaCompanyId = typeof area.companyId === 'number' ? 
            area.companyId : 
            (area.companyId ? parseInt(area.companyId.toString()) : null);
          return areaCompanyId === id;
        });
      }
      // Verifica anche il campo companyId diretto, se presente
      if (contact.companyId !== undefined) {
        const contactCompanyId = typeof contact.companyId === 'number' ? 
          contact.companyId : 
          (contact.companyId ? parseInt(contact.companyId.toString()) : null);
        return contactCompanyId === id;
      }
      return false;
    });
    
    setFilteredContacts(filtered);
    console.log(`Filtrati ${filtered.length} contatti per l'azienda ${id}`);
    
    // Aggiorniamo automaticamente il valore del contatto primario se ne è rimasto solo uno
    if (filtered.length === 1) {
      setValue("contactId", filtered[0].id);
    } else {
      setValue("contactId", null);
    }
    updateFilteredContacts(id);
  };
  
  // Helper function che utilizza direttamente i valori del form
  // Aggiungiamo controlli più rigorosi
  const getSelectedCompanyId = () => {
    const value = getValues("companyId");
    return typeof value === 'number' && !isNaN(value) ? value : null;
  };

  // Initialize form when in edit mode or reset for create mode
  useEffect(() => {
    if (!open) return;
    
    if (initialData && !formInitializedRef.current) {
      // Set form values from the existing deal
      if (initialData.name) setValue("name", String(initialData.name));
      if (initialData.value !== undefined) setValue("value", Number(initialData.value));
      if (initialData.stageId) setValue("stageId", Number(initialData.stageId));
      
      // Handle company ID
      if (initialData.companyId !== undefined) {
        const companyId = initialData.companyId !== null ? Number(initialData.companyId) : null;
        setValue("companyId", companyId);
        setCompanyIdInForm(companyId);
      }
      
      // Handle contact ID
      if (initialData.contactId !== undefined) {
        setValue("contactId", initialData.contactId !== null ? Number(initialData.contactId) : null);
      }

      // Format date
      if (initialData.expectedCloseDate) {
        const date = new Date(initialData.expectedCloseDate);
        if (!isNaN(date.getTime())) {
          setValue("expectedCloseDate", date.toISOString().split('T')[0]);
        }
      }

      // Set tags
      if (initialData.tags && Array.isArray(initialData.tags)) {
        setTagsInput(initialData.tags.join(", "));
      }

      // Set notes
      if (initialData.notes !== undefined) {
        setValue("notes", initialData.notes || "");
      }
      
      formInitializedRef.current = true;
    } else if (!initialData && !formInitializedRef.current) {
      // Reset for new deal creation
      reset();
      setTagsInput("");
      setCompanyIdInForm(null);
      
      // Set default stage if available
      if (Array.isArray(stages) && stages.length > 0 && stages[0]?.id) {
        setValue("stageId", stages[0].id);
      }
      
      formInitializedRef.current = true;
    }
  }, [initialData, open, reset, setValue, stages]);

  // When modal closes, reset the initialization flag
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
    }
  }, [open]);

  // Filter companies based on search query
  useEffect(() => {
    if (!companies || !Array.isArray(companies)) {
      console.log("Companies data is not available or not an array");
      return;
    }
    
    if (companySearchQuery.trim() === '') {
      setFilteredCompanies(companies);
      console.log("Setting all companies in filtered list:", companies.length);
    } else {
      const query = companySearchQuery.toLowerCase().trim();
      const filtered = companies.filter(company => 
        company && company.name && typeof company.name === 'string' && 
        company.name.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
      console.log(`Filtered companies by query "${query}":`, filtered.length);
    }
  }, [companySearchQuery, companies]);

  // Non usiamo più uno stato separato per l'ID dell'azienda, usiamo direttamente getValues




  
  // Utilizziamo una funzione separata per filtrare i contatti in base all'azienda selezionata
  // anziché un useEffect per evitare aggiornamenti non necessari
  const updateFilteredContacts = (companyId: number | null) => {
    if (!contacts || !Array.isArray(contacts)) {
      console.warn("Contacts data is not available or not an array");
      setFilteredContacts([]);
      return;
    }
    
    console.log("Filtering contacts for company ID:", companyId, "Available contacts:", contacts.length);
    
    if (!companyId) {
      // Se non c'è un'azienda selezionata, mostra lista vuota
      setFilteredContacts([]);
      console.log("No company selected, clearing contacts selection");
      return;
    }
    
    // Aggiungiamo debug per verificare le strutture dati
    console.log("DEBUG - Contatti disponibili:", contacts);
    
    // Filtriamo i contatti usando le aree di attività o altre associazioni
    const filteredByAreas = contacts.filter(contact => {
      // Debug per questo contatto specifico
      console.log(`DEBUG - Verifico contatto ${contact.id} (${contact.firstName} ${contact.lastName})`);
      
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
        console.log(`DEBUG - Contatto ${contact.id} ha ${contact.areasOfActivity.length} aree:`, contact.areasOfActivity);
        
        // Verifica le aree di attività
        const hasMatchingArea = contact.areasOfActivity.some(area => {
          const areaCompanyId = typeof area.companyId === 'number' ? 
            area.companyId : 
            (area.companyId ? parseInt(area.companyId as string) : null);
          
          console.log(`DEBUG - Area companyId=${areaCompanyId}, confronto con ${companyId}, match=${areaCompanyId === companyId}`);
          return areaCompanyId === companyId;
        });
        
        if (hasMatchingArea) return true;
      } else {
        console.log(`DEBUG - Contatto ${contact.id} non ha aree di attività`);
      }
      
      // Verifica anche il campo companyId diretto, se presente
      if (contact.companyId !== undefined) {
        const contactCompanyId = typeof contact.companyId === 'number' ? 
          contact.companyId : 
          (contact.companyId ? parseInt(contact.companyId as string) : null);
          
        console.log(`DEBUG - Contatto companyId=${contactCompanyId}, confronto con ${companyId}, match=${contactCompanyId === companyId}`);
        return contactCompanyId === companyId;
      }
      
      return false;
    });
    
    // Mostriamo SOLO i contatti associati all'azienda selezionata
    setFilteredContacts(filteredByAreas);
    console.log(`Filtrati ${filteredByAreas.length} contatti associati all'azienda ${companyId}`);
    
    if (filteredByAreas.length === 0) {
      console.log(`Non ci sono contatti associati all'azienda ${companyId}`);
    }
    /*
    // Solo per debug - Verifichiamo quanti contatti hanno areasOfActivity
    let contactsWithAreas = 0;
    contacts.forEach(contact => {
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity) && contact.areasOfActivity.length > 0) {
        contactsWithAreas++;
        console.log(`Contact ${contact.id} has ${contact.areasOfActivity.length} areas:`, contact.areasOfActivity);
      }
    });
    console.log(`${contactsWithAreas} / ${contacts.length} contacts have areasOfActivity data`);
    */
    // If there's only one contact for this company, auto-select it
    if (contacts.length === 1) {
      console.log(`Auto-selecting the only contact: ${contacts[0].id}`);
      setValue("contactId", contacts[0].id);
    } else if (contacts.length === 0) {
      // Clear contact selection if no contacts available
      setValue("contactId", null);
    }
  };
  
  // Rimuoviamo l'useEffect che causa cicli infiniti
  // Ora il filtro verrà aggiornato solo quando viene chiamato setCompanyIdInForm

  // Carica le sinergie esistenti nel form quando siamo in modalità di modifica
  useEffect(() => {
    if (isEditMode && dealSynergies && Array.isArray(dealSynergies) && dealSynergies.length > 0) {
      const contactIds = dealSynergies.map(synergy => 
        typeof synergy.contactId === 'string' ? parseInt(synergy.contactId) : synergy.contactId
      );
      
      const currentValue = getValues("synergyContactIds") || [];
      if (JSON.stringify(currentValue) !== JSON.stringify(contactIds)) {
        setValue("synergyContactIds", contactIds);
      }
    }
  }, [dealSynergies, isEditMode, getValues, setValue]);

  // Funzione per creare sinergie per i contatti selezionati
  const createSynergiesForContacts = async (dealId: number, companyId: number, contactIds: number[]) => {
    const results = [];

    for (const contactId of contactIds) {
      try {
        const result = await createSynergyMutation.mutateAsync({
          type: "business",
          contactId: contactId,
          companyId: companyId,
          dealId: dealId,
          status: "active",
          description: "Synergy created from deal",
          startDate: new Date()
        });
        results.push(result);
      } catch (error) {
        console.error(`Error creating synergy for contact ${contactId}:`, error);
      }
    }

    return results;
  };

  // Save deal mutation
  const saveDeal = useMutation({
    mutationFn: async (data: DealFormData) => {
      // Show alerts if needed
      if (data.companyId && !data.contactId) {
        setShowNoContactAlert(true);
        throw new Error("A contact is required when creating a deal for a company");
      }

      if (!data.companyId && !showNoCompanyAlert) {
        setShowNoCompanyAlert(true);
        throw new Error("Please confirm that you want to create a deal without a company");
      }

      // Prepare deal data
      const dealData: any = {
        name: data.name,
        value: data.value,
        stageId: data.stageId,
      };

      // Add optional fields
      if (data.companyId !== undefined) {
        dealData.companyId = data.companyId === null ? null : data.companyId;
      }

      if (data.contactId !== undefined) {
        dealData.contactId = data.contactId === null ? null : data.contactId;
      }

      if (data.notes) {
        dealData.notes = data.notes;
      }

      // Process tags
      if (tagsInput.trim()) {
        dealData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        dealData.tags = [];
      }

      // Format date
      if (data.expectedCloseDate) {
        const dateObj = new Date(data.expectedCloseDate);
        if (!isNaN(dateObj.getTime())) {
          dealData.expectedCloseDate = dateObj.toISOString();
        }
      }

      // Determine method and URL
      const method = isEditMode ? "PATCH" : "POST";
      const url = isEditMode ? `/api/deals/${initialData?.id}` : "/api/deals";

      // Make API request
      const response = await fetch(url, {
        method: method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const savedDeal = await response.json();

      // Creiamo le sinergie se ci sono contatti selezionati
      if (data.synergyContactIds && data.synergyContactIds.length > 0 && data.companyId) {
        try {
          await createSynergiesForContacts(
            savedDeal.id, 
            data.companyId, 
            data.synergyContactIds
          );
          
          // Invalidate synergies queries
          queryClient.invalidateQueries({ 
            queryKey: [`/api/deals/${savedDeal.id}/synergies`] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ["/api/synergies"] 
          });
        } catch (error) {
          console.error("Failed to create synergies:", error);
          toast({
            title: "Warning",
            description: "Deal was saved but failed to create synergy relationships",
            variant: "destructive",
          });
        }
      }

      return savedDeal;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Deal updated successfully" : "Deal created successfully",
      });

      // Close modal and reset form
      onOpenChange(false);
      reset();
      setTagsInput("");
      setCompanyIdInForm(null);
      setShowNoCompanyAlert(false);
      setShowNoContactAlert(false);
      formInitializedRef.current = false;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      // Don't show error for confirmation alerts
      if (error.message === "Please confirm that you want to create a deal without a company" ||
          error.message === "A contact is required when creating a deal for a company") {
        return;
      }

      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} deal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: DealFormData) => {
    saveDeal.mutate(data);
  };

  // Async function to load synergy contact options
  const loadSynergyContactOptions = (inputValue: string) => {
    return new Promise<any[]>((resolve) => {
      if (!getSelectedCompanyId()) {
        return resolve([]);
      }
      
      const endpoint = inputValue.trim() 
        ? `/api/contacts?search=${encodeURIComponent(inputValue)}&excludeCompanyId=${getSelectedCompanyId()}&includeAreas=true`
        : `/api/contacts?excludeCompanyId=${getSelectedCompanyId()}&limit=10&includeAreas=true`;
        
      fetch(endpoint)
        .then(response => {
          if (!response.ok) throw new Error('Failed to search contacts');
          return response.json();
        })
        .then(contacts => {
          if (!contacts || !Array.isArray(contacts)) {
            console.error("Invalid contacts data received:", contacts);
            resolve([]);
            return;
          }
          
          const options = contacts.map((contact: any) => ({
            value: contact && contact.id ? contact.id : 0,
            label: contact ? 
              `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || "Unnamed Contact" 
              : "Unknown Contact"
          }));
          resolve(options);
        })
        .catch(error => {
          console.error("Error searching contacts:", error);
          resolve([]);
        });
    });
  };

  return (
    <>
      {/* Alert Dialog for creating deal without company */}
      <AlertDialog open={showNoCompanyAlert} onOpenChange={setShowNoCompanyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Deal Without Company?</AlertDialogTitle>
            <AlertDialogDescription>
              You're creating a deal without linking it to a company. This is not recommended.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (formRef.current) {
                  const formData = getValues();
                  saveDeal.mutate(formData);
                }
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for missing contact */}
      <AlertDialog open={showNoContactAlert} onOpenChange={setShowNoContactAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Contact Selected</AlertDialogTitle>
            <AlertDialogDescription>
              You're creating a deal for a company without linking it to a specific contact.
              Please select a contact before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoContactAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Deal" : "Create New Deal"}</DialogTitle>
          </DialogHeader>
          
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Basic Deal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deal Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter deal name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input 
                    id="value" 
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("value")}
                  />
                  {errors.value && (
                    <p className="text-xs text-red-500">{errors.value.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stageId">Pipeline Stage</Label>
                  <Controller
                    name="stageId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(stages) && 
                            // Filtriamo i duplicati tenendo solo il primo stage per ogni nome
                            // Usiamo un approccio più sicuro per evitare errori di Map().values() con spread
                            // Prima creiamo un oggetto per raggruppare per nome
                            (() => {
                              const uniqueStages: Record<string, any> = {};
                              
                              // Riempi l'oggetto con uno stage per ogni nome
                              if (Array.isArray(stages)) {
                                stages.forEach((stage: any) => {
                                  if (stage && stage.name && !uniqueStages[stage.name]) {
                                    uniqueStages[stage.name] = stage;
                                  }
                                });
                              }
                              
                              // Converti l'oggetto in array e ordinalo
                              return Object.values(uniqueStages || {})
                                .sort((a: any, b: any) => {
                                  // Controllo difensivo per order
                                  const orderA = typeof a?.order === 'number' ? a.order : 0;
                                  const orderB = typeof b?.order === 'number' ? b.order : 0;
                                  return orderA - orderB;
                                });
                            })()
                              .map((stage: any) => (
                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                  {stage.name}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.stageId && (
                    <p className="text-xs text-red-500">{errors.stageId.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                  <Input 
                    id="expectedCloseDate" 
                    type="date"
                    {...register("expectedCloseDate")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="tags" 
                    placeholder="Enter comma-separated tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                  {tagsInput && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setTagsInput("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tagsInput.split(",").filter(tag => tag.trim()).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Company and Contact Selection */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Company</Label>
                <Controller
                  name="companyId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        const newCompanyId = parseInt(value, 10);
                        console.log("Company selected:", newCompanyId);
                        field.onChange(newCompanyId);
                        // Aggiorniamo lo stato locale dell'ID azienda
                        setCompanyId(newCompanyId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company">
                          {Array.isArray(companies) && field.value 
                            ? companies.find((company: any) => company.id === field.value)?.name 
                            : "Select company"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(companies) && companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.companyId && (
                  <p className="text-xs text-red-500">{errors.companyId.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactId">Primary Contact</Label>
                <Controller
                  name="contactId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      disabled={!getSelectedCompanyId()}
                      onValueChange={(value) => {
                        const contactId = parseInt(value, 10);
                        console.log("Contact selected:", contactId);
                        field.onChange(contactId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={getSelectedCompanyId() ? "Select contact" : "Select company first"}>
                          {field.value !== undefined && field.value !== null && Array.isArray(contacts)
                            ? (() => {
                                const foundContact = contacts.find((contact: any) => contact.id === field.value);
                                return foundContact 
                                  ? `${foundContact.firstName || ''} ${foundContact.lastName || ''}`.trim() || "No name"
                                  : "Select contact";
                              })()
                            : getSelectedCompanyId() ? "Select contact" : "Select company first"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(filteredContacts) && filteredContacts.length > 0 ? (
                          filteredContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-contacts" disabled>
                            No contacts for this company
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="synergyContactIds">Contatti Sinergia</Label>
                <Controller
                  name="synergyContactIds"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.length > 0 ? "selected" : ""}
                      onValueChange={(value) => {
                        if (value === "no-value") return;
                        const contactId = parseInt(value, 10);
                        
                        // Se il contactId è già selezionato, lo rimuoviamo
                        const current = field.value || [];
                        if (current.includes(contactId)) {
                          field.onChange(current.filter(id => id !== contactId));
                        } else {
                          // Altrimenti lo aggiungiamo
                          field.onChange([...current, contactId]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={getSelectedCompanyId() ? "Seleziona contatti sinergia" : "Seleziona prima un'azienda"}>
                          {field.value && Array.isArray(field.value) && field.value.length > 0 
                            ? `${field.value.length} contatti selezionati` 
                            : (getSelectedCompanyId() ? "Seleziona contatti sinergia" : "Seleziona prima un'azienda")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(contacts) && contacts.length > 0 ? (
                          contacts
                            // Filtra i contatti in modo che siano inclusi SOLO quelli che NON appartengono all'azienda selezionata
                            .filter(contact => {
                              // Ottieni l'ID dell'azienda dai valori del form
                              const companyId = getValues("companyId");
                              
                              // Se non c'è un'azienda selezionata, non mostrare nulla
                              if (!companyId) return false;
                              
                              // Per le sinergie, vogliamo i contatti che NON appartengono all'azienda selezionata
                              if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
                                // Se ha aree di attività, verifichiamo che NON ci sia l'azienda selezionata
                                return !contact.areasOfActivity.some(area => {
                                  // Normalizzazione del tipo di companyId
                                  let areaCompanyId = null;
                                  if (typeof area.companyId === 'number') {
                                    areaCompanyId = area.companyId;
                                  } else if (area.companyId) {
                                    areaCompanyId = parseInt(String(area.companyId));
                                  }
                                  
                                  // Il contatto è associato all'azienda selezionata? 
                                  // Se sì, escludiamolo (NON volevamo questo)
                                  return areaCompanyId === companyId;
                                });
                              }
                              
                              // Se non ha aree di attività, includiamolo (potrebbe essere una sinergia)
                              return true;
                            })
                            .map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      field.value && Array.isArray(field.value) && field.value.includes(contact.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}</span>
                                </div>
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-value" disabled>
                            Nessun contatto disponibile
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                
                {/* Rimosso il codice che usava watch per ridurre la complessità */}
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add deal notes here"
                {...register("notes")}
              />
            </div>
            
            {/* Actions */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveDeal.isPending}>
                {saveDeal.isPending ? "Saving..." : isEditMode ? "Update Deal" : "Create Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}