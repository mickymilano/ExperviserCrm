import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DealInfo } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Utility function for class name merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
// import { useCreateSynergy } from "@/hooks/useSynergies.tsx"; // Funzionalità sinergie rimossa
import { Badge } from "@/components/ui/badge";
import AsyncSelect from "react-select/async";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  status: z.string().default("active"),
  lastContactedAt: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  // La funzionalità sinergie è stata rimossa
  // synergyContactIds: z.array(z.coerce.number()).default([]),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function ImprovedDealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  
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
  
  // Debug log rimosso
  // console.log("Create synergy mutation disponibile:", !!createSynergyMutation);

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
  //   staleTime: Infinity // Prevent refetching during component lifecycle
  // });
  const dealSynergies = [];

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
      status: "active",
      // La funzionalità delle sinergie è stata rimossa
      // synergyContactIds: [],
    }
  });

  // Rimuoviamo la funzione setSelectedCompanyId e accediamo direttamente al ref

  // Wrapper function to get company ID safely
  const getSelectedCompanyId = () => selectedCompanyIdRef.current;
  
  // Sincronizza selectedCompanyIdRef solo quando necessario (non a ogni render)
  const updateSelectedCompanyIdFromForm = useCallback(() => {
    const currentCompanyId = getValues("companyId");
    if (currentCompanyId !== undefined && currentCompanyId !== null) {
      if (selectedCompanyIdRef.current !== Number(currentCompanyId)) {
        selectedCompanyIdRef.current = Number(currentCompanyId);
      }
    } else {
      selectedCompanyIdRef.current = null;
    }
  }, [getValues]);
  
  // Eseguiamo solo quando viene aperto il modale
  useEffect(() => {
    if (open) {
      updateSelectedCompanyIdFromForm();
    }
  }, [open, updateSelectedCompanyIdFromForm]);

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
        // Aggiorniamo direttamente il ref senza usare setSelectedCompanyId
        selectedCompanyIdRef.current = companyId;
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

      // Set last contacted date if available
      if (initialData.lastContactedAt) {
        const date = new Date(initialData.lastContactedAt);
        if (!isNaN(date.getTime())) {
          setValue("lastContactedAt", date.toISOString().split('T')[0]);
        }
      }

      // Set next follow-up date if available
      if (initialData.nextFollowUpAt) {
        const date = new Date(initialData.nextFollowUpAt);
        if (!isNaN(date.getTime())) {
          setValue("nextFollowUpAt", date.toISOString().split('T')[0]);
        }
      }

      // Set status
      if (initialData.status) {
        setValue("status", initialData.status);
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
      selectedCompanyIdRef.current = null;
      
      // Set default stage if available
      if (stages && Array.isArray(stages) && stages.length > 0) {
        setValue("stageId", stages[0]?.id);
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

  // Filter contacts based on selected company
  useEffect(() => {
    if (!contacts || !Array.isArray(contacts)) return;
    
    // Accediamo direttamente al ref
    const currentCompanyId = selectedCompanyIdRef.current;
    
    if (!currentCompanyId) {
      setFilteredContacts(contacts);
      return;
    }
    
    // Only show contacts associated with selected company
    const filteredContactsList = contacts.filter(contact => {
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        return false;
      }
      return contact.areasOfActivity.some((area: { companyId: number }) => 
        area.companyId === currentCompanyId
      );
    });
    
    setFilteredContacts(filteredContactsList);
  // Non includiamo selectedCompanyIdRef.current nell'array di dipendenze
  // per evitare cicli di aggiornamento
  }, [contacts]);

  // La funzionalità delle sinergie è stata rimossa
  // const previousSynergiesRef = useRef<any[]>([]);
  // const dealSynergiesInitializedRef = useRef<boolean>(false);
  
  // useEffect(() => {
  //   // Effetto rimosso con la rimozione del modulo sinergie
  // }, []);

  // Helper function to create synergies for contacts
  // Questo metodo gestisce le sinergie per un deal, creando o aggiornando secondo necessità
  // La funzionalità delle sinergie è stata rimossa
  // const createSynergiesForContacts = async (dealId: number, companyId: number, contactIds: number[]) => {
  //   // Funzione rimossa in quanto parte del modulo sinergie
  // };

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
        status: data.status,
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

      // Format dates
      if (data.expectedCloseDate) {
        const dateObj = new Date(data.expectedCloseDate);
        if (!isNaN(dateObj.getTime())) {
          dealData.expectedCloseDate = dateObj.toISOString();
        }
      }

      // Add follow-up dates
      if (data.lastContactedAt) {
        const dateObj = new Date(data.lastContactedAt);
        if (!isNaN(dateObj.getTime())) {
          dealData.lastContactedAt = dateObj.toISOString();
        }
      }

      if (data.nextFollowUpAt) {
        const dateObj = new Date(data.nextFollowUpAt);
        if (!isNaN(dateObj.getTime())) {
          dealData.nextFollowUpAt = dateObj.toISOString();
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
      // Impostiamo direttamente il ref a null
      selectedCompanyIdRef.current = null;
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

  // Async function to load synergy contact options - contatti per sinergie
  const loadSynergyContactOptions = (inputValue: string) => {
    return new Promise<any[]>((resolve) => {
      if (!getSelectedCompanyId()) {
        return resolve([]);
      }
      
      // Return empty results for very short inputs (less than 1 character)
      // This prevents unnecessary API calls but still allows typeahead search
      if (inputValue.length < 1) {
        return resolve([]);
      }
      
      // Get current selected synergy contacts to exclude them from results (prevent duplicates)
      const currentSynergyContactIds = getValues("synergyContactIds") || [];
      
      // Also exclude the primary contact of the deal
      const primaryContactId = getValues("contactId");
      const excludeContactIds = [...currentSynergyContactIds];
      if (primaryContactId) {
        excludeContactIds.push(primaryContactId);
      }
      
      // Build query with selected company ID (exclude contacts already in this company)
      const companyId = getSelectedCompanyId();
      
      // Build the exclude contacts query parameter
      const excludeContactsParam = excludeContactIds.length > 0 
        ? `&excludeContactIds=${excludeContactIds.join(',')}` 
        : '';
        
      const endpoint = `/api/contacts?search=${encodeURIComponent(inputValue.trim())}&excludeCompanyId=${companyId}${excludeContactsParam}&includeAreas=true`;
        
      fetch(endpoint)
        .then(response => {
          if (!response.ok) throw new Error('Failed to search contacts');
          return response.json();
        })
        .then(contacts => {
          if (!Array.isArray(contacts)) {
            console.error("Contacts API did not return an array:", contacts);
            return resolve([]);
          }
          
          console.log(`Found ${contacts.length} potential synergy contacts`);
          
          // Filter out contacts that are already selected (just in case the API doesn't filter them out)
          const filteredContacts = contacts.filter(contact => 
            !currentSynergyContactIds.includes(contact.id) && 
            (!primaryContactId || contact.id !== primaryContactId)
          );
          
          // Map contacts to select options format
          const options = filteredContacts.map((contact: any) => ({
            value: contact.id,
            label: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || `Contact #${contact.id}`,
            data: contact // Store full contact data for reference
          }));
          
          console.log("Synergy contact options:", options);
          resolve(options);
        })
        .catch(error => {
          console.error("Error searching synergy contacts:", error);
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
              It's recommended to always assign a deal to a contact. Please select a contact
              or confirm you want to continue without one.
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
              Proceed Without Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deal Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Deal" : "Create Deal"}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="pr-4 flex-grow">
            <form id="dealForm" ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2">
              {/* Deal Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Deal Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter deal name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Two Column Layout for Value and Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deal Value */}
                <div className="space-y-2">
                  <Label htmlFor="value">Value (€) <span className="text-red-500">*</span></Label>
                  <Input
                    id="value"
                    type="number"
                    {...register("value")}
                    placeholder="Enter deal value"
                    className={errors.value ? "border-red-500" : ""}
                  />
                  {errors.value && <p className="text-red-500 text-xs">{errors.value.message}</p>}
                </div>

                {/* Pipeline Stage */}
                <div className="space-y-2">
                  <Label htmlFor="stageId">Stage <span className="text-red-500">*</span></Label>
                  <Controller
                    name="stageId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className={errors.stageId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((stage: any) => (
                            <SelectItem key={stage.id} value={String(stage.id)}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.stageId && <p className="text-red-500 text-xs">{errors.stageId.message}</p>}
                </div>
              </div>

              {/* Two Column Layout for Company and Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Selection */}
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
                            aria-expanded={open}
                            className={`w-full justify-between ${errors.companyId ? "border-red-500" : ""}`}
                          >
                            {field.value
                              ? companies.find((company: any) => company.id === field.value)?.name || "Select company"
                              : "Select company"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[300px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search company..." 
                              value={companySearchQuery}
                              onValueChange={setCompanySearchQuery}
                            />
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredCompanies.map((company: any) => (
                                <CommandItem
                                  key={company.id}
                                  value={company.name}
                                  onSelect={() => {
                                    field.onChange(company.id);
                                    // Aggiorniamo direttamente la ref senza usare setSelectedCompanyId
                                    selectedCompanyIdRef.current = company.id;
                                    setCompanySearchQuery("");
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
                  {errors.companyId && <p className="text-red-500 text-xs">{errors.companyId.message}</p>}
                </div>

                {/* Contact Selection */}
                <div className="space-y-2">
                  <Label htmlFor="contactId">Contact</Label>
                  <Controller
                    name="contactId"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                            disabled={!getSelectedCompanyId()}
                          >
                            {field.value
                              ? (() => {
                                  const contact = contacts.find((contact: any) => contact.id === field.value);
                                  return contact 
                                    ? `${contact.firstName} ${contact.lastName}`
                                    : "Select contact";
                                })()
                              : getSelectedCompanyId() 
                                ? "Select contact" 
                                : "Select company first"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search contact..." />
                            <CommandEmpty>No contact found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredContacts.map((contact: any) => (
                                <CommandItem
                                  key={contact.id}
                                  value={`${contact.firstName} ${contact.lastName}`}
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
                                  {contact.firstName} {contact.lastName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
              </div>

              {/* Two Column Layout for Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Expected Close Date */}
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    {...register("expectedCloseDate")}
                  />
                </div>

                {/* Last Contacted Date */}
                <div className="space-y-2">
                  <Label htmlFor="lastContactedAt">Last Contacted</Label>
                  <Input
                    id="lastContactedAt"
                    type="date"
                    {...register("lastContactedAt")}
                  />
                </div>

                {/* Next Follow-up Date */}
                <div className="space-y-2">
                  <Label htmlFor="nextFollowUpAt">Next Follow-up</Label>
                  <Input
                    id="nextFollowUpAt"
                    type="date"
                    {...register("nextFollowUpAt")}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Enter tags, separated by commas"
                />
                {tagsInput && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagsInput.split(",").map((tag, index) => {
                      const trimmedTag = tag.trim();
                      if (!trimmedTag) return null;
                      return (
                        <Badge key={index} variant="secondary" className="py-1 px-2">
                          {trimmedTag}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newTags = tagsInput
                                .split(",")
                                .filter((_, i) => i !== index)
                                .join(", ");
                              setTagsInput(newTags);
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* La funzionalità delle sinergie è stata rimossa */}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  placeholder="Add deal notes here..."
                />
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveDeal.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="dealForm"
              disabled={saveDeal.isPending}
            >
              {saveDeal.isPending ? "Saving..." : (isEditMode ? "Update Deal" : "Create Deal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}