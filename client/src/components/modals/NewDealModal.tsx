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
import { ContactCombobox } from "@/components/ui/ContactCombobox";
import { SynergiesSelect } from "@/components/ui/SynergiesSelect";

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
  areasOfActivity?: Array<{ companyId: number; isPrimary?: boolean }>;
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
        // Mantieni i valori numerici come numeri
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString() : undefined
      };
      
      console.log("Payload inviato al server:", payload);
      
      if (isEditMode && initialData?.id) {
        // Aggiorna un deal esistente
        const response = await fetch(`/api/deals/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Errore dal server:", errorData);
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
          const errorData = await response.json().catch(() => null);
          console.error("Errore dal server:", errorData);
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
      // Invalida le query per aggiornare l'UI
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      
      // Mostra un messaggio di successo
      toast({
        title: isEditMode ? "Deal aggiornato" : "Deal creato",
        description: isEditMode ? "Il deal è stato aggiornato con successo" : "Il deal è stato creato con successo",
        variant: "default",
      });
      
      // Chiudi la modale e resetta il form
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving deal:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del deal",
        variant: "destructive",
      });
    }
  });

  // Handler del submit del form
  const onSubmit = (data: DealFormData) => {
    saveDeal.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifica Deal" : "Crea Nuovo Deal"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Prima riga: Azienda e Persona (Contatto) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Azienda (facoltativa) */}
            <div className="space-y-2">
              <Label htmlFor="companyId">Azienda (facoltativa)</Label>
              <Controller
                control={control}
                name="companyId"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => {
                      const companyId = parseInt(value);
                      field.onChange(companyId);
                      handleCompanySelect(companyId);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona azienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies && companies.map((company) => (
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
            
            {/* Contatto (obbligatorio) */}
            <div className="space-y-2">
              <Label htmlFor="contactId">Persona <span className="text-red-500">*</span></Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <ContactCombobox
                    contacts={watchCompanyId ? getCompanyContacts() : contacts}
                    value={field.value ? field.value.toString() : ""}
                    onChange={(value) => {
                      const contactId = parseInt(value);
                      field.onChange(contactId);
                      // Se selezioniamo un contatto che ha un'azienda primaria e non abbiamo già selezionato un'azienda
                      if (!watchCompanyId) {
                        const selectedContact = contacts.find(c => c.id === contactId);
                        if (selectedContact && selectedContact.areasOfActivity) {
                          const primaryCompany = selectedContact.areasOfActivity.find(area => area.isPrimary);
                          if (primaryCompany && primaryCompany.companyId) {
                            setValue("companyId", primaryCompany.companyId);
                            handleCompanySelect(primaryCompany.companyId);
                          }
                        }
                      }
                    }}
                    placeholder="Seleziona persona"
                    emptyMessage={watchCompanyId ? "Nessun contatto trovato per questa azienda" : "Nessun contatto trovato"}
                  />
                )}
              />
              {errors.contactId && (
                <p className="text-xs text-red-500">{errors.contactId.message}</p>
              )}
            </div>
          </div>
          
          {/* Seconda riga: Filiale (dipende dall'azienda), Pipeline Stage e Deal Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filiale (visibile solo se è selezionata un'azienda) */}
            <div className="space-y-2">
              <Label htmlFor="branchId">Filiale</Label>
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                    }}
                    disabled={!watchCompanyId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={watchCompanyId ? "Seleziona filiale" : "Prima seleziona un'azienda"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches && branches.length > 0 ? (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-branches" disabled>
                          {watchCompanyId ? "Nessuna filiale disponibile" : "Prima seleziona un'azienda"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            {/* Pipeline Stage */}
            <div className="space-y-2">
              <Label htmlFor="stageId">Stage <span className="text-red-500">*</span></Label>
              <Controller
                name="stageId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages && stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stageId && (
                <p className="text-xs text-red-500">{errors.stageId.message}</p>
              )}
            </div>
            
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
          </div>
          
          {/* Terza riga: Valore, Data Inizio, e Data Chiusura Prevista */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valore */}
            <div className="space-y-2">
              <Label htmlFor="value">Valore (€) <span className="text-red-500">*</span></Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                {...register("value")}
                className={cn(errors.value && "border-red-500")}
              />
              {errors.value && (
                <p className="text-xs text-red-500">{errors.value.message}</p>
              )}
            </div>
            
            {/* Data Inizio */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inizio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleziona data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
            
            {/* Data Chiusura Prevista */}
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Data Chiusura Prevista</Label>
              <Controller
                name="expectedCloseDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleziona data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
          </div>
          
          {/* Quarta riga: Revenue Attesa, Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Attesa */}
            <div className="space-y-2">
              <Label htmlFor="expectedRevenue">Revenue Attesa (€)</Label>
              <Input
                id="expectedRevenue"
                type="number"
                step="0.01"
                min="0"
                {...register("expectedRevenue")}
                className={cn(errors.expectedRevenue && "border-red-500")}
              />
              {errors.expectedRevenue && (
                <p className="text-xs text-red-500">{errors.expectedRevenue.message}</p>
              )}
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separati da virgola)</Label>
              <div className="flex space-x-2">
                <Input
                  id="tags-input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onBlur={handleAddTag}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Aggiungi tags..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                >
                  Aggiungi
                </Button>
              </div>
              
              {/* Visualizza i tag selezionati */}
              {watch("tags") && watch("tags")!.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {watch("tags")!.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-transparent"
                        onClick={() => {
                          const newTags = [...watch("tags") as string[]];
                          newTags.splice(index, 1);
                          setValue("tags", newTags);
                          setTagsInput(newTags.join(", "));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Campo per le sinergie */}
          <SynergiesSelect
            contacts={getSynergyContacts()}
            control={control}
            name="synergyContactIds"
            label="Sinergie (max 10 contatti)"
            placeholder="Seleziona contatti sinergia..."
            className="space-y-2"
          />
          
          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              rows={4}
              placeholder="Aggiungi dettagli o note sul deal..."
            />
          </div>
          
          {/* Allegati (da implementare con il backend) */}
          <div className="space-y-2">
            <Label>Allegati</Label>
            <div className="border border-gray-200 rounded-md p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFileButtonClick}
                className="w-full h-32 flex flex-col items-center justify-center"
              >
                <Upload className="h-8 w-8 mb-2" />
                <span>Fai click per caricare file</span>
                <span className="text-xs text-muted-foreground mt-1">
                  (o trascina e rilascia)
                </span>
              </Button>
              
              {/* Visualizza il file selezionato */}
              {selectedFile && (
                <div className="mt-3">
                  <Badge variant="outline" className="flex items-center gap-2">
                    {selectedFile.name}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-transparent"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : isEditMode ? "Aggiorna Deal" : "Crea Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}