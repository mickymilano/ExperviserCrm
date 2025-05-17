import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useCreateSynergy } from "@/hooks/useSynergies";

interface DealInfo {
  id?: number;
  name: string;
  value: number;
  stageId?: number;
  companyId?: number | null;
  contactId?: number | null;
  branchId?: number | null;
  expectedCloseDate?: string | Date;
  startDate?: string | Date;
  expectedRevenue?: number;
  tags?: string[] | null;
  notes?: string | null;
  status?: string;
  files?: any[] | null;
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
  areasOfActivity?: Array<{ companyId: number }>;
  [key: string]: any;
}

interface Branch {
  id: number;
  name: string;
  companyId: number;
  [key: string]: any;
}

interface SynergyContact {
  id: number;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DealInfo | null;
}

// Schema di validazione per il form
const dealSchema = z.object({
  name: z.string().min(1, "Nome del deal richiesto"),
  value: z.coerce.number().min(0, "Il valore deve essere un numero positivo"),
  companyId: z.coerce.number().optional().nullable(),
  contactId: z.coerce.number().min(1, "Contatto principale richiesto"),
  branchId: z.coerce.number().optional().nullable(),
  stageId: z.coerce.number(),
  startDate: z.date().optional(),
  expectedCloseDate: z.date().optional(),
  expectedRevenue: z.coerce.number().min(0, "Il valore della revenue deve essere un numero positivo").optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  synergyContactIds: z.array(z.number()).max(10, "Puoi selezionare massimo 10 contatti sinergia").optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function NewDealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");
  const [openCompanyCombobox, setOpenCompanyCombobox] = useState(false);
  const [openContactCombobox, setOpenContactCombobox] = useState(false);
  const [openBranchCombobox, setOpenBranchCombobox] = useState(false);
  // Stato separato per l'ID dell'azienda selezionata
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  // Funzione per impostare l'ID dell'azienda selezionata
  const handleCompanySelect = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setValue("companyId", companyId);
    // Resetta la selezione della filiale quando cambia l'azienda
    setValue("branchId", null);
    setOpenCompanyCombobox(false);
  };
  
  // Funzioni per gestire i contatti e filiali
  const handleContactSelect = (contactId: number) => {
    setValue("contactId", contactId);
    setOpenContactCombobox(false);
  };
  
  const handleBranchSelect = (branchId: number) => {
    setValue("branchId", branchId);
    setOpenBranchCombobox(false);
  };
  const [selectedSynergyContacts, setSelectedSynergyContacts] = useState<SynergyContact[]>([]);
  const [openSynergyCombobox, setOpenSynergyCombobox] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formInitializedRef = useRef(false);
  const isEditMode = initialData && initialData.id !== undefined;

  // Hook per la creazione di sinergie  
  const createSynergyMutation = useCreateSynergy();

  // Inizializzazione del form con react-hook-form
  const { 
    register, 
    handleSubmit, 
    control, 
    setValue, 
    watch, 
    reset, 
    formState: { errors, isSubmitting } 
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      value: 0,
      companyId: null,
      contactId: undefined,
      branchId: null,
      stageId: undefined,
      startDate: undefined,
      expectedCloseDate: undefined,
      expectedRevenue: 0,
      notes: "",
      tags: [],
      synergyContactIds: [],
    }
  });

  // Ottieni valori del form in tempo reale
  const watchCompanyId = watch("companyId");
  const watchSynergyContactIds = watch("synergyContactIds");

  // Fetch pipeline stages
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/pipeline-stages"],
    enabled: open,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!open
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts?includeAreas=true"],
    enabled: !!open
  });

  // Fetch branches condizionato dalla selezione dell'azienda
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches", watchCompanyId],
    enabled: !!(open && watchCompanyId !== undefined && watchCompanyId !== null),
  });

  // Fetch synergies per i deal esistenti
  const { data: dealSynergies = [] } = useQuery({
    queryKey: [`/api/deals/${initialData?.id}/synergies`],
    enabled: !!(open && isEditMode && initialData?.id !== undefined),
  });

  // Funzione che filtra i contatti in base all'azienda selezionata
  const getCompanyContacts = () => {
    if (!contacts || !Array.isArray(contacts) || !watchCompanyId) {
      return [];
    }

    return contacts.filter(contact => {
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
        return contact.areasOfActivity.some(area => {
          const areaCompanyId = typeof area.companyId === 'number' ? 
            area.companyId : 
            area.companyId ? parseInt(String(area.companyId)) : null;
          
          return areaCompanyId === watchCompanyId;
        });
      }
      return false;
    });
  };

  // Funzione che filtra i contatti NON associati all'azienda selezionata (per sinergie)
  const getSynergyContacts = () => {
    if (!contacts || !Array.isArray(contacts)) {
      return contacts || [];
    }
    
    // Se non è selezionata un'azienda, mostriamo tutti i contatti per le sinergie
    if (!watchCompanyId) {
      return contacts;
    }

    return contacts.filter(contact => {
      if (contact.areasOfActivity && Array.isArray(contact.areasOfActivity)) {
        return !contact.areasOfActivity.some(area => {
          const areaCompanyId = typeof area.companyId === 'number' ? 
            area.companyId : 
            area.companyId ? parseInt(String(area.companyId)) : null;
          
          return areaCompanyId === watchCompanyId;
        });
      }
      // Se il contatto non ha aree di attività, lo includiamo nei contatti sinergici
      return true;
    });
  };

  // Aggiorna le sinergie selezionate quando cambiano i contatti o gli ID selezionati
  useEffect(() => {
    if (watchSynergyContactIds && Array.isArray(watchSynergyContactIds) && contacts && Array.isArray(contacts)) {
      const selectedContacts = watchSynergyContactIds.map(id => 
        contacts.find(contact => contact.id === id)
      ).filter(contact => contact !== undefined) as SynergyContact[];
      
      setSelectedSynergyContacts(selectedContacts);
    } else {
      setSelectedSynergyContacts([]);
    }
  }, [watchSynergyContactIds, contacts]);

  // Inizializza il form quando siamo in modalità modifica
  useEffect(() => {
    if (!open) return;
    
    if (initialData && !formInitializedRef.current) {
      // Imposta i valori del form dai dati esistenti
      if (initialData.name) setValue("name", initialData.name);
      if (initialData.value !== undefined) setValue("value", initialData.value);
      if (initialData.stageId) setValue("stageId", initialData.stageId);
      
      // Gestisci l'ID dell'azienda
      if (initialData.companyId !== undefined) {
        const companyId = initialData.companyId !== null ? initialData.companyId : null;
        setValue("companyId", companyId);
        setSelectedCompanyId(companyId);
      }
      
      // Gestisci l'ID del contatto
      if (initialData.contactId !== undefined) {
        setValue("contactId", initialData.contactId);
      }
      
      // Gestisci l'ID della filiale
      if (initialData.branchId !== undefined) {
        setValue("branchId", initialData.branchId);
      }

      // Formatta le date
      if (initialData.startDate) {
        const date = new Date(initialData.startDate);
        if (!isNaN(date.getTime())) {
          setValue("startDate", date);
        }
      }
      
      if (initialData.expectedCloseDate) {
        const date = new Date(initialData.expectedCloseDate);
        if (!isNaN(date.getTime())) {
          setValue("expectedCloseDate", date);
        }
      }

      // Revenue attesa
      if (initialData.expectedRevenue !== undefined) {
        setValue("expectedRevenue", initialData.expectedRevenue);
      }

      // Imposta i tag
      if (initialData.tags && Array.isArray(initialData.tags)) {
        setValue("tags", initialData.tags);
        setTagsInput(initialData.tags.join(", "));
      }

      // Imposta le note
      if (initialData.notes !== undefined) {
        setValue("notes", initialData.notes || "");
      }
      
      formInitializedRef.current = true;
    } else if (!initialData && !formInitializedRef.current) {
      // Reset per la creazione di un nuovo deal
      reset();
      setTagsInput("");
      setSelectedCompanyId(null);
      setSelectedSynergyContacts([]);
      
      // Imposta uno stage predefinito se disponibile
      if (Array.isArray(stages) && stages.length > 0 && stages[0]?.id) {
        setValue("stageId", stages[0].id);
      }
      
      formInitializedRef.current = true;
    }
  }, [initialData, open, reset, setValue, stages]);

  // Carica le sinergie esistenti nel form quando siamo in modalità di modifica
  useEffect(() => {
    if (isEditMode && dealSynergies && Array.isArray(dealSynergies) && dealSynergies.length > 0) {
      const contactIds = dealSynergies.map(synergy => 
        typeof synergy.contactId === 'string' ? parseInt(synergy.contactId) : synergy.contactId
      );
      
      setValue("synergyContactIds", contactIds);
    }
  }, [dealSynergies, isEditMode, setValue]);

  // Quando la modale si chiude, resetta il flag di inizializzazione
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
    }
  }, [open]);

  // Funzione per aggiungere un tag alla lista
  const handleAddTag = () => {
    const trimmedInput = tagsInput.trim();
    if (!trimmedInput) return;
    
    const tagArray = trimmedInput.split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    setValue("tags", tagArray);
  };

  // Gestione del file selezionato
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Trigger per aprire il selettore di file
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Seleziona o deseleziona un contatto sinergia
  const toggleSynergyContact = (contact: SynergyContact) => {
    const currentIds = watchSynergyContactIds || [];
    
    // Controlla se il contatto è già selezionato
    const contactIndex = currentIds.indexOf(contact.id);
    let newIds;
    
    if (contactIndex >= 0) {
      // Rimuovi il contatto se è già selezionato
      newIds = [...currentIds];
      newIds.splice(contactIndex, 1);
    } else {
      // Aggiungi il contatto se non supera il limite di 10
      if (currentIds.length >= 10) {
        toast({
          title: "Limite raggiunto",
          description: "Puoi selezionare un massimo di 10 contatti sinergia",
          variant: "destructive"
        });
        return;
      }
      
      newIds = [...currentIds, contact.id];
    }
    
    setValue("synergyContactIds", newIds);
  };

  // Rimuovi un contatto sinergia dalla selezione
  const removeSynergyContact = (contactId: number) => {
    const currentIds = watchSynergyContactIds || [];
    const newIds = currentIds.filter(id => id !== contactId);
    setValue("synergyContactIds", newIds);
  };

  // Funzione per creare sinergie per i contatti selezionati
  const createSynergiesForContacts = async (dealId: number, companyId: number | null, contactIds: number[]) => {
    if (!companyId) return [];
    
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

  // Mutation per salvare il deal
  const saveDeal = useMutation({
    mutationFn: async (data: DealFormData) => {
      // Prepara i dati per l'invio
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString() : undefined
      };
      
      if (isEditMode && initialData?.id) {
        // Aggiorna un deal esistente
        const response = await fetch(`/api/deals/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update deal');
        }
        
        const updatedDeal = await response.json();
        
        // Gestisci le sinergie se è stata selezionata un'azienda
        if (data.companyId && data.synergyContactIds && data.synergyContactIds.length > 0) {
          await createSynergiesForContacts(initialData.id, data.companyId, data.synergyContactIds);
        }
        
        return updatedDeal;
      } else {
        // Crea un nuovo deal
        const response = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create deal');
        }
        
        const newDeal = await response.json();
        
        // Gestisci le sinergie se è stata selezionata un'azienda
        if (data.companyId && data.synergyContactIds && data.synergyContactIds.length > 0) {
          await createSynergiesForContacts(newDeal.id, data.companyId, data.synergyContactIds);
        }
        
        return newDeal;
      }
    },
    onSuccess: () => {
      // Invalida le query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
      
      // Mostra toast di successo
      toast({
        title: isEditMode ? "Deal aggiornato" : "Deal creato",
        description: isEditMode ? "Deal aggiornato con successo" : "Nuovo deal creato con successo",
      });
      
      // Chiudi la modale
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving deal:", error);
      toast({
        title: "Errore",
        description: `Si è verificato un errore durante il salvataggio del deal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handler per il submit del form
  const onSubmit = (data: DealFormData) => {
    console.log("Form data submitted:", data);
    saveDeal.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifica Deal" : "Nuovo Deal"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Prima riga: Azienda e Persona (Contatto) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Azienda (facoltativa) */}
            <div className="space-y-2">
              <Label htmlFor="companyId">Azienda (facoltativa)</Label>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <Popover open={openCompanyCombobox} onOpenChange={setOpenCompanyCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCompanyCombobox}
                        className="w-full justify-between"
                      >
                        {field.value && companies ? 
                          companies.find((company) => company.id === field.value)?.name ?? "Seleziona azienda" 
                          : "Seleziona azienda"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cerca azienda..." />
                        <CommandEmpty>Nessuna azienda trovata.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {companies && companies.map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.name}
                              onSelect={() => handleCompanySelect(company.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === company.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {company.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.companyId && (
                <p className="text-xs text-red-500">{errors.companyId.message}</p>
              )}
            </div>
            
            {/* Contatto (obbligatorio) */}
            <div className="space-y-2">
              <Label htmlFor="contactId">Persona <span className="text-red-500">*</span></Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Popover open={openContactCombobox} onOpenChange={setOpenContactCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openContactCombobox}
                        className={cn(
                          "w-full justify-between",
                          errors.contactId && "border-red-500"
                        )}
                      >
                        {field.value && contacts ? 
                          (() => {
                            const contact = contacts.find((c) => c.id === field.value);
                            return contact 
                              ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() 
                              : "Seleziona contatto";
                          })() 
                          : "Seleziona contatto"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cerca contatto..." />
                        <CommandEmpty>Nessun contatto trovato.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {/* Se c'è un'azienda selezionata, mostra solo i contatti di quell'azienda */}
                          {watchCompanyId
                            ? getCompanyContacts().map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={`${contact.firstName || ''} ${contact.lastName || ''}`}
                                  onSelect={() => {
                                    setValue("contactId", contact.id);
                                    setOpenContactCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === contact.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Senza nome'}
                                </CommandItem>
                              ))
                            : contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={`${contact.firstName || ''} ${contact.lastName || ''}`}
                                  onSelect={() => {
                                    setValue("contactId", contact.id);
                                    setOpenContactCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === contact.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Senza nome'}
                                </CommandItem>
                              ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.contactId && (
                <p className="text-xs text-red-500">{errors.contactId.message}</p>
              )}
            </div>
          </div>
          
          {/* Seconda riga: Filiale (solo se è selezionata un'azienda) */}
          {watchCompanyId && (
            <div className="space-y-2">
              <Label htmlFor="branchId">Filiale</Label>
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <Popover open={openBranchCombobox} onOpenChange={setOpenBranchCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBranchCombobox}
                        className="w-full justify-between"
                      >
                        {field.value && branches ? 
                          branches.find((branch) => branch.id === field.value)?.name ?? "Seleziona filiale" 
                          : "Seleziona filiale"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cerca filiale..." />
                        <CommandEmpty>Nessuna filiale trovata per questa azienda.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {branches && branches.map((branch) => (
                            <CommandItem
                              key={branch.id}
                              value={branch.name}
                              onSelect={() => {
                                setValue("branchId", branch.id);
                                setOpenBranchCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === branch.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {branch.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          )}
          
          {/* Terza riga: Contatti Sinergia */}
          <div className="space-y-2">
            <Label>Contatti Sinergia (max 10)</Label>
            <Popover open={openSynergyCombobox} onOpenChange={setOpenSynergyCombobox}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Seleziona contatti sinergia
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cerca contatti..." />
                  <CommandEmpty>Nessun contatto trovato.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {getSynergyContacts().map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={`${contact.firstName || ''} ${contact.lastName || ''}`}
                        onSelect={() => toggleSynergyContact(contact)}
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watchSynergyContactIds?.includes(contact.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>
                            {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Senza nome'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Mostra i contatti sinergia selezionati */}
            {selectedSynergyContacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSynergyContacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
                    {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Senza nome'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSynergyContact(contact.id)} 
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Quarta riga: Date e Stage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data di inizio */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data di inizio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Seleziona data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            
            {/* Data di conclusione prevista */}
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Data conclusione prevista</Label>
              <Controller
                name="expectedCloseDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Seleziona data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            
            {/* Stage del Deal */}
            <div className="space-y-2">
              <Label htmlFor="stageId">Fase pipeline</Label>
              <Controller
                name="stageId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(stages) && stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          {/* Quinta riga: Nome del Deal, importo e revenue prevista */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nome Deal */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Deal <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                {...register("name")}
                className={cn(errors.name && "border-red-500")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            {/* Importo Deal */}
            <div className="space-y-2">
              <Label htmlFor="value">Importo Deal</Label>
              <Input
                id="value"
                type="number"
                {...register("value")}
                className={cn(errors.value && "border-red-500")}
              />
              {errors.value && (
                <p className="text-xs text-red-500">{errors.value.message}</p>
              )}
            </div>
            
            {/* Revenue prevista */}
            <div className="space-y-2">
              <Label htmlFor="expectedRevenue">Revenue prevista</Label>
              <Input
                id="expectedRevenue"
                type="number"
                {...register("expectedRevenue")}
                className={cn(errors.expectedRevenue && "border-red-500")}
              />
              {errors.expectedRevenue && (
                <p className="text-xs text-red-500">{errors.expectedRevenue.message}</p>
              )}
            </div>
          </div>
          
          {/* Sesta riga: Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tag</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Inserisci tag separati da virgole"
                onBlur={handleAddTag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>
            {watch("tags") && watch("tags")!.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {watch("tags")!.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Settima riga: Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              rows={3}
              placeholder="Note aggiuntive sul deal..."
            />
          </div>
          
          {/* Ottava riga: Upload file */}
          <div className="space-y-2">
            <Label>Allegati</Label>
            <div className="border border-dashed rounded-md p-6 text-center cursor-pointer" onClick={handleFileButtonClick}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                {selectedFile ? selectedFile.name : "Trascina qui i file o clicca per caricare"}
              </p>
            </div>
          </div>
          
          {/* Nona riga: Email associate (placeholder per funzionalità futura) */}
          <div className="space-y-2">
            <Label>Email Associate</Label>
            <div className="border rounded-md p-4 bg-gray-50">
              <p className="text-sm text-gray-500 text-center">
                Le email associate a questo deal appariranno qui (funzionalità in arrivo)
              </p>
            </div>
          </div>
          
          {/* Footer con pulsanti */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvataggio..." : isEditMode ? "Aggiorna Deal" : "Crea Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}