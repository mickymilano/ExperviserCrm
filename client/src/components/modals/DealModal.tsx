import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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

type DealFormData = {
  name: string;
  value: number;
  stageId: number;
  companyId?: number | null;
  contactId?: number | null;
  expectedCloseDate?: string;
  tags?: string[] | null;
  notes?: string | null;
  synergyContactIds?: number[];
};

export default function DealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { t } = useTranslation();
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
  
  // Aggiorniamo i contatti sinergici quando cambia l'azienda selezionata
  useEffect(() => {
    // Filtriamo i contatti per mostrare solo quelli che NON appartengono all'azienda selezionata
    if (!companyId || !contacts || !Array.isArray(contacts)) {
      setSynergyContacts([]);
      return;
    }
    
    const filteredContacts = contacts.filter(contact => {
      // Se il contatto ha aree di attività, verifichiamo che NON sia associato all'azienda selezionata
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
        // Controlliamo se il contatto ha l'azienda selezionata tra le sue aree
        return !contact.areasOfActivity.some(area => {
          // Normalizziamo companyId
          const areaCompanyId = typeof area.companyId === 'number' ? 
            area.companyId : 
            area.companyId ? parseInt(String(area.companyId)) : null;
          
          return areaCompanyId === companyId;
        });
      }
      
      // Se non ha aree di attività, lo includiamo nei contatti sinergici
      return true;
    });
    
    setSynergyContacts(filteredContacts);
    console.log(`Filtrati ${filteredContacts.length} contatti sinergici (esclusi quelli dell'azienda ${companyId})`);
  }, [companyId, contacts, setSynergyContacts]);

  const dealSchema = z.object({
    name: z.string().min(1, t("deals.validation.nameRequired", "Il nome dell'opportunità è obbligatorio")),
    value: z.coerce.number().min(0, t("deals.validation.valuePositive", "Il valore deve essere un numero positivo")),
    stageId: z.coerce.number(),
    companyId: z.coerce.number().optional().nullable(),
    contactId: z.coerce.number().optional().nullable(),
    expectedCloseDate: z.string().optional(),
    tags: z.array(z.string()).optional().nullable(),
    notes: z.string().optional().nullable(),
    synergyContactIds: z.array(z.number()).optional()
  });

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
    
    // Aggiorna lo stato locale per scatenare l'aggiornamento dei contatti sinergici
    setCompanyId(id);
    
    // Filtra i contatti associati all'azienda senza creare cicli
    updateFilteredContacts(id);
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
    
    // Effettuiamo una query all'API per ottenere i contatti dell'azienda specificata
    // Questo è un approccio alternativo che garantisce di catturare tutti i tipi di associazione
    fetch(`/api/companies/${companyId}/contacts`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error fetching company contacts');
        }
        return response.json();
      })
      .then(companyContacts => {
        console.log(`Found ${companyContacts.length} contacts via API for company ${companyId}`);
        
        // Usa direttamente i contatti dell'API senza filtrare, dato che l'API è già affidabile
        // Questo risolve il problema dove i contatti restituiti dall'API non vengono visualizzati
        const filteredByAPI = companyContacts.map(apiContact => {
          // Troviamo il contatto completo dal nostro elenco per avere tutti i dati
          const fullContact = contacts.find(contact => contact.id === apiContact.id);
          return fullContact || apiContact; // Usiamo i dati completi se disponibili, altrimenti quelli dall'API
        });
        
        // Backup: se l'API non restituisce contatti, proviamo il metodo con le aree di attività
        if (filteredByAPI.length === 0) {
          console.log("API non ha restituito contatti, provo con areasOfActivity");
          
          // Filtriamo i contatti usando le aree di attività o altre associazioni
          const filteredByAreas = contacts.filter(contact => {
            if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
              // Verifica le aree di attività
              return contact.areasOfActivity.some(area => {
                // Normalizziamo companyId considerando diverse possibili strutture
                const areaCompanyId = typeof area.companyId === 'number' ? 
                  area.companyId : 
                  typeof area.companyId === 'string' ? 
                  parseInt(area.companyId) : 
                  area.company_id ? 
                  parseInt(String(area.company_id)) : null;
                
                return areaCompanyId === companyId;
              });
            }
            
            // Verifica anche il campo companyId diretto, se presente
            if (contact.companyId !== undefined) {
              const contactCompanyId = typeof contact.companyId === 'number' ? 
                contact.companyId : 
                (contact.companyId ? parseInt(contact.companyId as string) : null);
              
              return contactCompanyId === companyId;
            }
            
            return false;
          });
          
          // Usiamo i contatti filtrati con aree di attività
          setFilteredContacts(filteredByAreas);
          console.log(`Filtrati ${filteredByAreas.length} contatti con aree di attività`);
          
          // Auto-select single contact or clear selection
          if (filteredByAreas.length === 1) {
            console.log(`Auto-selecting the only contact: ${filteredByAreas[0].id}`);
            setValue("contactId", filteredByAreas[0].id);
          } else if (filteredByAreas.length === 0) {
            setValue("contactId", null);
            console.log("Nessun contatto trovato per questa azienda, svuoto la selezione");
          }
        } else {
          // Usiamo i contatti ottenuti dall'API
          setFilteredContacts(filteredByAPI);
          console.log(`Impostati ${filteredByAPI.length} contatti dall'API`);
          
          // Auto-select single contact or clear selection
          if (filteredByAPI.length === 1) {
            console.log(`Auto-selecting the only contact: ${filteredByAPI[0].id}`);
            setValue("contactId", filteredByAPI[0].id);
          } else if (filteredByAPI.length === 0) {
            setValue("contactId", null);
            console.log("Nessun contatto trovato per questa azienda, svuoto la selezione");
          }
        }
      })
      .catch(error => {
        console.error("Error fetching company contacts:", error);
        
        // Fallback: filtra contatti usando le aree di attività
        const filteredByAreas = contacts.filter(contact => {
          if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
            return contact.areasOfActivity.some(area => {
              const areaCompanyId = typeof area.companyId === 'number' ? 
                area.companyId : 
                area.companyId ? parseInt(String(area.companyId)) : null;
              
              return areaCompanyId === companyId;
            });
          }
          return false;
        });
        
        setFilteredContacts(filteredByAreas);
        console.log(`Fallback: filtrati ${filteredByAreas.length} contatti`);
        
        if (filteredByAreas.length === 1) {
          setValue("contactId", filteredByAreas[0].id);
        } else if (filteredByAreas.length === 0) {
          setValue("contactId", null);
        }
      });
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
        value: data.value.toString(), // Converti il valore in stringa per compatibilità con il campo decimal nel DB
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
            title: t("common.warning", "Attenzione"),
            description: t("deals.errors.synergy_fail", "L'opportunità è stata salvata ma non è stato possibile creare le relazioni di sinergia"),
            variant: "destructive",
          });
        }
      }

      return savedDeal;
    },
    onSuccess: () => {
      toast({
        title: t("common.success", "Operazione completata"),
        description: isEditMode ? t("deals.success.updated", "Opportunità aggiornata con successo") : t("deals.success.created", "Opportunità creata con successo"),
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
            <AlertDialogTitle>{t("deals.alerts.noCompany", "Nessuna azienda selezionata")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deals.alerts.noCompanyDescription", "Per creare un'opportunità è necessario selezionare un'azienda. Vuoi procedere comunque?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Annulla")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (formRef.current) {
                  const formData = getValues();
                  saveDeal.mutate(formData);
                }
              }}
            >
              {t("common.proceed", "Procedi")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for missing contact */}
      <AlertDialog open={showNoContactAlert} onOpenChange={setShowNoContactAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deals.alerts.noContact", "Nessun contatto selezionato")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deals.alerts.noContactDescription", "Stai creando un'opportunità per un'azienda senza collegarla a un contatto specifico. Per favore seleziona un contatto prima di procedere.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoContactAlert(false)}>
              {t("common.ok", "OK")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t("deals.edit_deal", "Modifica opportunità") : t("deals.new_deal", "Nuova opportunità")}</DialogTitle>
          </DialogHeader>
          
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Basic Deal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("deals.form.name", "Nome opportunità")}</Label>
                  <Input 
                    id="name" 
                    placeholder={t("deals.form.name_placeholder", "Inserisci nome opportunità")}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">{t("deals.form.value", "Valore")}</Label>
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
                  <Label htmlFor="stageId">{t("deals.form.pipeline_stage", "Fase pipeline")}</Label>
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
                          <SelectValue placeholder={t("deals.form.select_stage", "Seleziona fase")} />
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
                  <Label htmlFor="expectedCloseDate">{t("deals.form.expected_close_date", "Data di chiusura prevista")}</Label>
                  <Input 
                    id="expectedCloseDate" 
                    type="date"
                    {...register("expectedCloseDate")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">{t("deals.form.tags", "Etichette")}</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="tags" 
                    placeholder={t("deals.form.tags_placeholder", "Inserisci etichette separate da virgole")}
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
                        <SelectValue placeholder={getSelectedCompanyId() ? t("deals.form.select_contact", "Seleziona contatto") : t("deals.form.select_company_first", "Seleziona prima l'azienda")}>
                          {field.value !== undefined && field.value !== null && Array.isArray(contacts)
                            ? (() => {
                                const foundContact = contacts.find((contact: any) => contact.id === field.value);
                                return foundContact 
                                  ? `${foundContact.firstName || ''} ${foundContact.lastName || ''}`.trim() || t("deals.form.no_name", "Senza nome")
                                  : t("deals.form.select_contact", "Seleziona contatto");
                              })()
                            : getSelectedCompanyId() ? t("deals.form.select_contact", "Seleziona contatto") : t("deals.form.select_company_first", "Seleziona prima l'azienda")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(filteredContacts) && filteredContacts.length > 0 ? (
                          filteredContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || t("deals.form.unnamed_contact", "Contatto senza nome")}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-contacts" disabled>
                            {t("deals.form.no_contacts", "Nessun contatto per questa azienda")}
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
                        {!getSelectedCompanyId() ? (
                          <div className="p-2 text-sm text-gray-500">Seleziona prima un'azienda</div>
                        ) : Array.isArray(synergyContacts) && synergyContacts.length > 0 ? (
                          synergyContacts
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
              <Label htmlFor="notes">{t("deals.form.notes", "Note")}</Label>
              <Textarea 
                id="notes" 
                placeholder={t("deals.form.notes_placeholder", "Aggiungi note sull'opportunità qui")}
                {...register("notes")}
              />
            </div>
            
            {/* Actions */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Annulla")}
              </Button>
              <Button type="submit" disabled={saveDeal.isPending}>
                {saveDeal.isPending ? t("common.saving", "Salvataggio in corso...") : isEditMode ? t("deals.actions.update_deal", "Aggiorna opportunità") : t("deals.actions.create_deal", "Crea opportunità")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}