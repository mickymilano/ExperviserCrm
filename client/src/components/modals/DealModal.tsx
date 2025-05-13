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
import { DealInfo } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
// import { useCreateSynergy } from "@/hooks/useSynergies.tsx"; // Funzionalità sinergie rimossa
import { Badge } from "@/components/ui/badge";
import AsyncSelect from "react-select/async";

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
  // La proprietà synergyContactIds è stata rimossa in quanto la funzionalità sinergie non è più supportata
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  
  // Use ref for selected company to avoid render cycles
  const selectedCompanyIdRef = useRef<number | null>(null);
  const formInitializedRef = useRef(false);
  
  // Form reference for alert dialog submission
  const formRef = useRef<HTMLFormElement>(null);

  const [showNoCompanyAlert, setShowNoCompanyAlert] = useState(false);
  const [showNoContactAlert, setShowNoContactAlert] = useState(false);
  const isEditMode = !!initialData && initialData.id !== undefined;

  // La funzionalità delle sinergie è stata rimossa
  // const createSynergyMutation = useCreateSynergy();

  // Fetch pipeline stages 
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/pipeline-stages"],
    enabled: open,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts?includeAreas=true"],
    enabled: open,
  });

  // La funzionalità delle sinergie è stata rimossa
  // const { data: dealSynergies = [] } = useQuery({
  //   queryKey: [`/api/deals/${initialData?.id}/synergies`],
  //   enabled: open && isEditMode && initialData?.id !== undefined,
  //   staleTime: Infinity
  // });

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
      // synergyContactIds: [], // campo rimosso dalla funzionalità
    }
  });

  // Helper function to manage company selection with proper logging
  const setSelectedCompanyId = (id: number | null) => {
    console.log("Setting selected company ID to:", id);
    selectedCompanyIdRef.current = id;
    setSelectedCompany(id);
    // Also update the form value directly
    setValue("companyId", id);
  };
  
  // Helper function to get company ID from state
  const getSelectedCompanyId = () => selectedCompany;

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
        setSelectedCompanyId(companyId);
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
      setSelectedCompanyId(null);
      
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
    if (!companies || !Array.isArray(companies)) return;
    
    if (companySearchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const query = companySearchQuery.toLowerCase().trim();
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    }
  }, [companySearchQuery, companies]);

  // Aggiorniamo i contatti filtrati quando cambia l'azienda selezionata
  useEffect(() => {
    // Rilevare quando cambia l'azienda selezionata nel form
    const companyIdFromForm = getValues("companyId");
    console.log("Form company ID (from form):", companyIdFromForm);
    
    // Solo se l'ID dell'azienda è diverso dall'ID corrente, aggiorniamo lo stato
    if (companyIdFromForm && companyIdFromForm !== selectedCompany) {
      console.log("Setting company ID from form:", companyIdFromForm);
      setSelectedCompanyId(Number(companyIdFromForm));
    }
  }, [getValues, selectedCompany]);




  
  // Filter contacts based on selected company
  useEffect(() => {
    if (!contacts || !Array.isArray(contacts)) {
      console.warn("Contacts data is not available or not an array");
      return;
    }
    
    const currentCompanyId = selectedCompany;
    console.log("Filtering contacts for company ID:", currentCompanyId);
    
    if (!currentCompanyId) {
      // Se non c'è un'azienda selezionata, mostra tutti i contatti
      setFilteredContacts([]);
      console.log("No company selected, clearing contacts selection");
      return;
    }
    
    // Only show contacts associated with selected company
    const filteredContactsList = contacts.filter(contact => {
      // Check if the contact has areasOfActivity data
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        console.log(`Contact ${contact.id} has no areasOfActivity data`);
        return false;
      }
      
      // Check if any area links the contact to the selected company
      const isAssociated = contact.areasOfActivity.some((area: { companyId: number }) => 
        area.companyId === currentCompanyId
      );
      
      if (isAssociated) {
        console.log(`Contact ${contact.id} (${contact.firstName} ${contact.lastName}) is associated with company ${currentCompanyId}`);
      }
      
      return isAssociated;
    });
    
    console.log(`Filtered contacts for company ID ${currentCompanyId}: found ${filteredContactsList.length} contacts`);
    setFilteredContacts(filteredContactsList);
    
    // If there's only one contact for this company, auto-select it
    if (filteredContactsList.length === 1) {
      console.log(`Auto-selecting the only contact: ${filteredContactsList[0].id}`);
      setValue("contactId", filteredContactsList[0].id);
    } else if (filteredContactsList.length === 0) {
      // Clear contact selection if no contacts available
      setValue("contactId", null);
    }
    
  }, [contacts, selectedCompany, setValue]);

  // La funzionalità delle sinergie è stata rimossa
  /*
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
  */

  // La funzionalità delle sinergie è stata rimossa
  /*
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
  */

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

      // La funzionalità delle sinergie è stata rimossa
      /*
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
      */

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
      setSelectedCompanyId(null);
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
          const options = contacts.map((contact: any) => ({
            value: contact.id,
            label: `${contact.firstName} ${contact.lastName}`
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
                            [...new Map(stages.map((stage: any) => [stage.name, stage])).values()]
                              .sort((a: any, b: any) => a.order - b.order)
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {field.value !== undefined && field.value !== null && Array.isArray(companies)
                            ? companies.find((company: any) => company.id === field.value)?.name || "Select company"
                            : "Select company"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search company..." 
                            onValueChange={setCompanySearchQuery}
                          />
                          <CommandEmpty>No company found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {Array.isArray(filteredCompanies) && filteredCompanies.map((company: any) => (
                              <CommandItem
                                key={company.id}
                                onSelect={() => {
                                  console.log("Company selection - Setting ID:", company.id, company.name);
                                  // Set the company ID using our single setter function
                                  setSelectedCompanyId(company.id);
                                  // Also set in the form directly
                                  field.onChange(company.id);
                                  // Reset contact selection
                                  setValue("contactId", null);
                                }}
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
              
              <div className="space-y-2">
                <Label htmlFor="contactId">Primary Contact</Label>
                <Controller
                  name="contactId"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={!getSelectedCompanyId()}
                        >
                          {field.value !== undefined && field.value !== null && Array.isArray(contacts)
                            ? (() => {
                                const foundContact = contacts.find((contact: any) => contact.id === field.value);
                                return foundContact 
                                  ? `${foundContact.firstName || ''} ${foundContact.lastName || ''}`.trim() || "No name"
                                  : "Select contact";
                              })()
                            : getSelectedCompanyId() ? "Select contact" : "Select company first"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search contact..." />
                          <CommandEmpty>No contact found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {Array.isArray(filteredContacts) && filteredContacts.length > 0 ? (
                              filteredContacts.map((contact: any) => (
                                <CommandItem
                                  key={contact.id}
                                  onSelect={() => {
                                    field.onChange(contact.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === contact.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {`${contact.firstName} ${contact.lastName}`}
                                </CommandItem>
                              ))
                            ) : (
                              <CommandItem disabled>No contacts for this company</CommandItem>
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
              
              {/* La sezione delle sinergie è stata rimossa */}
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