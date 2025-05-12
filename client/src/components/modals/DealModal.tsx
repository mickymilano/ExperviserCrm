import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DealInfo } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Combobox } from "@/components/ui/combobox";
import { useCreateSynergy } from "@/hooks/useSynergies";

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
  synergyContactId: z.coerce.number().optional().nullable(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags && initialData.tags.length > 0 ? initialData.tags.join(", ") : ""
  );
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    initialData?.companyId || null
  );
  const [synergyContactId, setSynergyContactId] = useState<string | null>(null);
  const [filteredSynergyContacts, setFilteredSynergyContacts] = useState<any[]>([]);
  const [synergyOptions, setSynergyOptions] = useState<Array<{value: string, label: string}>>([]);
  
  // Form reference for alert dialog submission
  const formRef = useRef<HTMLFormElement>(null);
  
  const [showNoCompanyAlert, setShowNoCompanyAlert] = useState(false);
  const [showNoContactAlert, setShowNoContactAlert] = useState(false);
  const isEditMode = !!initialData;
  
  // Use createSynergy mutation
  const createSynergyMutation = useCreateSynergy();

  // Fetch pipeline stages for dropdown
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/pipeline-stages"],
    enabled: open,
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  // Fetch contacts with areas of activity for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts?includeAreas=true"],
    enabled: open,
  });

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<DealFormData>({
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
      synergyContactId: undefined,
    }
  });

  // Initialize form when in edit mode or set default stage if in create mode
  useEffect(() => {
    if (initialData && open) {
      try {
        // Set form values from the existing deal
        if (initialData.name !== undefined) setValue("name", String(initialData.name));
        if (initialData.value !== undefined) setValue("value", Number(initialData.value));
        if (initialData.stageId !== undefined) setValue("stageId", Number(initialData.stageId));
        if (initialData.companyId !== undefined) {
          const companyId = initialData.companyId !== null ? Number(initialData.companyId) : null;
          setValue("companyId", companyId);
          setSelectedCompanyId(companyId);
        }
        if (initialData.contactId !== undefined) setValue("contactId", initialData.contactId !== null ? Number(initialData.contactId) : null);
        
        // Format date for input field if exists
        if (initialData.expectedCloseDate) {
          const date = new Date(initialData.expectedCloseDate);
          if (!isNaN(date.getTime())) {
            setValue("expectedCloseDate", date.toISOString().split('T')[0]);
          }
        }
        
        // Set tags for display
        if (initialData.tags && Array.isArray(initialData.tags) && initialData.tags.length > 0) {
          setTagsInput(initialData.tags.join(", "));
        }
        
        if (initialData.notes !== undefined) {
          setValue("notes", initialData.notes || "");
        }
      } catch (error) {
        console.error("Error setting form values:", error);
      }
    } else if (stages && stages.length > 0 && open) {
      // Set default stage for new deal
      setValue("stageId", stages[0].id);
    }
  }, [initialData, stages, open, setValue]);
  
  // Effect per impostare le aziende filtrate inizialmente
  useEffect(() => {
    if (companies && Array.isArray(companies)) {
      setFilteredCompanies(companies);
    }
  }, [companies]);
  
  // Effect per filtrare le aziende in base alla ricerca
  useEffect(() => {
    if (companies && Array.isArray(companies)) {
      if (companySearchQuery.trim() === '') {
        // Se non c'è una query di ricerca, mostriamo tutte le aziende
        setFilteredCompanies(companies);
      } else {
        // Altrimenti filtriamo in base alla query
        const query = companySearchQuery.toLowerCase().trim();
        const filtered = companies.filter(company => 
          company.name.toLowerCase().includes(query)
        );
        setFilteredCompanies(filtered);
      }
    }
  }, [companySearchQuery, companies]);
  
  // Effect per filtrare i contatti in base all'azienda selezionata
  useEffect(() => {
    if (contacts && Array.isArray(contacts)) {
      // Se un'azienda è selezionata, mostra solo i contatti associati a quell'azienda
      if (selectedCompanyId) {
        const filteredContactsList = contacts.filter(contact => {
          if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
            return false;
          }
          return contact.areasOfActivity.some(area => area.companyId === selectedCompanyId);
        });
        setFilteredContacts(filteredContactsList);
        
        // Also filter synergy contacts - these are contacts NOT associated with this company
        const synergyContactsList = contacts.filter(contact => {
          if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
            return true; // Include contacts with no company associations
          }
          // Include only if they are NOT associated with the selected company
          return !contact.areasOfActivity.some(area => area.companyId === selectedCompanyId);
        });
        setFilteredSynergyContacts(synergyContactsList);
      } else {
        // Se nessuna azienda è selezionata, mostra tutti i contatti
        setFilteredContacts(contacts);
        setFilteredSynergyContacts([]);
      }
    }
  }, [contacts, selectedCompanyId]);

  const createSynergy = useMutation({
    mutationFn: async (data: { contactId: number, companyId: number, dealId: number }) => {
      const synergyData = {
        type: "business",
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        status: "active",
        description: "Synergy created from deal",
        startDate: new Date()
      };
      
      const response = await fetch('/api/synergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(synergyData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create synergy: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log("Synergy created successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
    },
    onError: (error) => {
      console.error("Failed to create synergy:", error);
      toast({
        title: "Warning",
        description: "Deal was created but failed to create synergy relationship",
        variant: "destructive",
      });
    }
  });

  const saveDeal = useMutation({
    mutationFn: async (data: DealFormData) => {
      // Controllo se è necessario mostrare avvisi
      if (data.companyId && !data.contactId) {
        setShowNoContactAlert(true);
        throw new Error("A contact is required when creating a deal for a company");
      }
      
      if (!data.companyId && !showNoCompanyAlert) {
        setShowNoCompanyAlert(true);
        throw new Error("Please confirm that you want to create a deal without a company");
      }
      
      // Create a new clean object for the request
      const dealData: any = {
        name: data.name,
        value: data.value,
        stageId: data.stageId,
      };
      
      // Only add optional fields if they have values
      if (data.companyId !== undefined) {
        dealData.companyId = data.companyId === null ? null : data.companyId;
      }
      
      if (data.contactId !== undefined) {
        dealData.contactId = data.contactId === null ? null : data.contactId;
      }
      
      if (data.notes) {
        dealData.notes = data.notes;
      }
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        dealData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        dealData.tags = [];
      }
      
      // Format the date for the API if it exists
      if (data.expectedCloseDate) {
        const dateObj = new Date(data.expectedCloseDate);
        if (!isNaN(dateObj.getTime())) {
          dealData.expectedCloseDate = dateObj.toISOString();
        }
      }
      
      console.log("Deal data being sent:", dealData);
      
      // Determine if we're updating or creating
      const method = isEditMode && initialData && 'id' in initialData ? "PATCH" : "POST";
      // Solo se stiamo modificando un deal esistente E abbiamo un ID valido, usiamo PATCH
      const url = method === "PATCH" && initialData && 'id' in initialData 
        ? `/api/deals/${initialData.id}` 
        : "/api/deals";
      
      // Make the API request
      const response = await fetch(url, {
        method: method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const createdDeal = await response.json();
      
      // Se è stata specificata una sinergia, creiamola
      if (data.synergyContactId && data.companyId) {
        try {
          await createSynergy.mutateAsync({
            contactId: data.synergyContactId,
            companyId: data.companyId,
            dealId: createdDeal.id
          });
        } catch (error) {
          console.error("Failed to create synergy:", error);
          // Ma continuiamo con il processo, il deal è stato comunque creato
        }
      }
      
      return createdDeal;
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
      setSynergyContactId(null);
      setShowNoCompanyAlert(false);
      setShowNoContactAlert(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      // Non mostriamo errore se è solo il warning di conferma
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

  // Update synergy options when filtered contacts change
  useEffect(() => {
    // Create options from filtered synergy contacts
    const options = filteredSynergyContacts
      .map(contact => ({
        value: contact.id.toString(),
        label: `${contact.firstName} ${contact.lastName}`
      }));
    
    setSynergyOptions(options);
  }, [filteredSynergyContacts]);
  
  return (
    <>
      {/* Alert Dialog per conferma deal senza azienda */}
      <AlertDialog open={showNoCompanyAlert} onOpenChange={setShowNoCompanyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Deal Without Company?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create a deal without associating it to any company.
              This deal will be focused solely on the individual contact.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoCompanyAlert(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoCompanyAlert(false);
              if (formRef.current) {
                handleSubmit(onSubmit)();
              }
            }}>
              Yes, Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert Dialog per deal senza contatto */}
      <AlertDialog open={showNoContactAlert} onOpenChange={setShowNoContactAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contact Required</AlertDialogTitle>
            <AlertDialogDescription>
              A deal associated with a company must have a contact person.
              Please select a contact before creating this deal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoContactAlert(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{isEditMode ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
          </DialogHeader>
          
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 mb-4">
              <Label htmlFor="name">Deal Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" min="0" step="0.01" {...register("value")} />
                {errors.value && (
                  <p className="text-xs text-destructive">{errors.value.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stageId">Stage</Label>
                <Select 
                  defaultValue={initialData?.stageId?.toString() || stages[0]?.id?.toString()}
                  onValueChange={(value) => setValue("stageId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stageId && (
                  <p className="text-xs text-destructive">{errors.stageId.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Company</Label>
                <div className="relative">
                  {/* Campo di ricerca input */}
                  <Input
                    type="text"
                    placeholder="Search company or select from list"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    className="mb-1"
                  />
                  
                  {/* Dropdown di selezione con risultati filtrati */}
                  <Select 
                    defaultValue={initialData?.companyId?.toString() || "0"}
                    onValueChange={(value) => {
                      const companyId = value === "0" ? null : parseInt(value);
                      setValue("companyId", companyId);
                      setSelectedCompanyId(companyId);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {/* Se abbiamo un contatto selezionato, mostriamo prima la sua azienda primaria */}
                      {filteredCompanies.map((company) => {
                        // Creiamo una variabile per monitorare se questa è l'azienda primaria
                        // senza utilizzare form o register direttamente, perché non sono accessibili qui
                        let isPrimaryCompany = false;
                        
                        // Cerchiamo nei contatti se qualcuno ha quest'azienda come primaria
                        if (contacts && Array.isArray(contacts)) {
                          const selectedContactId = initialData?.contactId || null;
                          const selectedContact = selectedContactId 
                            ? contacts.find(c => c.id === selectedContactId) 
                            : null;
                          
                          // Se troviamo un contatto selezionato, verifichiamo se ha quest'azienda come primaria
                          if (selectedContact?.areasOfActivity?.length > 0) {
                            isPrimaryCompany = selectedContact.areasOfActivity.some(
                              area => area.companyId === company.id && area.isPrimary
                            );
                          }
                        }
                        
                        return (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name} {isPrimaryCompany ? " (Primary)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactId">Contact</Label>
                <Select 
                  defaultValue={initialData?.contactId?.toString() || "0"} 
                  onValueChange={(value) => {
                    const contactId = value === "0" ? null : parseInt(value);
                    setValue("contactId", contactId);
                    
                    // Se è selezionato un contatto, cerca la sua azienda primaria
                    if (contactId && contacts && Array.isArray(contacts)) {
                      const selectedContact = contacts.find(c => c.id === contactId);
                      
                      if (selectedContact?.areasOfActivity?.length > 0) {
                        // Trova l'area di attività primaria (o prende la prima disponibile)
                        const primaryArea = selectedContact.areasOfActivity.find(a => a.isPrimary) || 
                                           selectedContact.areasOfActivity[0];
                                           
                        // Se l'area ha un'azienda associata, suggeriscila come scelta predefinita
                        if (primaryArea?.companyId) {
                          setValue("companyId", primaryArea.companyId);
                          setSelectedCompanyId(primaryArea.companyId);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {filteredContacts.length > 0 && selectedCompanyId ? (
                      filteredContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Campo Sinergie */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="synergyContactId">Synergy Contact</Label>
              <div className="relative">
                <Combobox
                  options={synergyOptions}
                  value={synergyContactId || ""}
                  onChange={(value) => {
                    setSynergyContactId(value);
                    setValue("synergyContactId", value ? parseInt(value) : null);
                  }}
                  placeholder="Search for a contact to create a synergy"
                  emptyMessage="No contacts found"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Select a contact to create a synergy relationship with this deal
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input 
                id="expectedCloseDate" 
                type="date" 
                defaultValue={initialData?.expectedCloseDate ? new Date(initialData.expectedCloseDate).toISOString().split('T')[0] : undefined}
                {...register("expectedCloseDate")} 
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags" 
                placeholder="Separate tags with commas" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveDeal.isPending}>
                {saveDeal.isPending ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Deal' : 'Add Deal')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}