import { useState, useEffect, useRef, useMemo } from "react";
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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DealInfo } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useCreateSynergy } from "@/hooks/useSynergies";
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
  synergyContactIds: z.array(z.coerce.number()).default([]),
}).refine((data) => {
  // If synergy contacts are selected, a company is required
  if (data.synergyContactIds && data.synergyContactIds.length > 0 && !data.companyId) {
    return false;
  }
  return true;
}, {
  message: "A company is required when synergy contacts are selected",
  path: ["companyId"]
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

  // Fetch synergies for the initial deal if in edit mode
  const { data: dealSynergies = [] } = useQuery({
    queryKey: [`/api/deals/${initialData?.id}/synergies`],
    enabled: open && isEditMode && initialData?.id !== undefined,
    staleTime: Infinity // Prevent refetching during component lifecycle to avoid infinite loop
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
      synergyContactIds: [],
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
    } else if (stages && Array.isArray(stages) && stages.length > 0 && open) {
      // Set default stage for new deal
      setValue("stageId", stages[0]?.id);
    }
  // Remove setValue from dependencies to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, stages, open]);

  // Combined effect to initialize and filter companies based on search
  useEffect(() => {
    if (!companies || !Array.isArray(companies)) return;
    
    if (companySearchQuery.trim() === '') {
      // If no search query, show all companies
      setFilteredCompanies(companies);
    } else {
      // Filter based on search query
      const query = companySearchQuery.toLowerCase().trim();
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    }
  }, [companySearchQuery, companies]);

  // Effect to filter contacts based on the selected company
  useEffect(() => {
    if (!contacts || !Array.isArray(contacts)) return;
    
    if (!selectedCompanyId) {
      // If no company is selected, show all contacts
      setFilteredContacts(contacts);
      return;
    }
    
    // Only show contacts associated with selected company in the main contact dropdown
    const filteredContactsList = contacts.filter(contact => {
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        return false;
      }
      return contact.areasOfActivity.some((area: { companyId: number }) => area.companyId === selectedCompanyId);
    });
    setFilteredContacts(filteredContactsList);
    
    // Note: We don't need to filter synergy contacts here anymore
    // as we're using the async server-side search via the API
  }, [contacts, selectedCompanyId]);

  // We're now using the async search API directly instead of filtering locally

  // Initialize selected synergy contacts from existing synergies when editing a deal
  useEffect(() => {
    if (isEditMode && dealSynergies && Array.isArray(dealSynergies) && dealSynergies.length > 0) {
      console.log("Loading existing synergies for edit mode:", dealSynergies);
      
      // Set the form value with numeric IDs for submission
      const contactIds = dealSynergies.map(synergy => 
        typeof synergy.contactId === 'string' ? parseInt(synergy.contactId) : synergy.contactId
      );
      
      // Compare with current value to avoid unnecessary updates
      const currentValue = getValues("synergyContactIds") || [];
      if (JSON.stringify(currentValue) !== JSON.stringify(contactIds)) {
        setValue("synergyContactIds", contactIds);
      }
    }
  // Only include dealSynergies and isEditMode in dependencies to prevent infinite loops
  // setValue and getValues shouldn't change between renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealSynergies, isEditMode]);

  // Helper function to create multiple synergies at once for all selected contacts
  const createSynergiesForContacts = async (dealId: number, companyId: number, contactIds: number[]) => {
    console.log("Creating synergies for contacts:", contactIds);
    const results = [];

    for (const contactId of contactIds) {
      const synergyData = {
        type: "business",
        contactId: contactId,
        companyId: companyId,
        dealId: dealId,
        status: "active",
        description: "Synergy created from deal",
        startDate: new Date().toISOString()
      };

      try {
        const response = await fetch('/api/synergies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(synergyData),
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to create synergy for contact ${contactId}: ${errorText}`);
          continue;
        }

        const result = await response.json();
        results.push(result);
      } catch (error) {
        console.error(`Error creating synergy for contact ${contactId}:`, error);
      }
    }

    return results;
  }

  const createSynergiesMutation = useMutation({
    mutationFn: async (data: { contactIds: number[], companyId: number, dealId: number }) => {
      return createSynergiesForContacts(data.dealId, data.companyId, data.contactIds);
    },
    onSuccess: () => {
      console.log("Synergies created successfully");
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

  // This function has been replaced by createSynergiesForContacts
  /*
  const createMultipleSynergies = async (contactIds: number[], companyId: number, dealId: number) => {
    if (!companyId || !contactIds || contactIds.length === 0) return;

    const results = [];
    for (const contactId of contactIds) {
      try {
        const result = await createSynergy.mutateAsync({
          contactId,
          companyId,
          dealId
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to create synergy for contact ${contactId}:`, error);
      }
    }
    return results;
  };
  */

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

      // If synergy contacts are specified, create synergy relationships
      if (data.synergyContactIds && data.synergyContactIds.length > 0 && data.companyId) {
        try {
          console.log("Creating synergies for selected contacts:", data.synergyContactIds);

          // Use our helper function to create synergies for all selected contacts
          const synergyResults = await createSynergiesForContacts(
            createdDeal.id, 
            data.companyId, 
            data.synergyContactIds
          );
          
          console.log(`Created ${synergyResults.length} synergy relationships`);
          
          // Invalidate synergies queries to reflect the changes
          queryClient.invalidateQueries({ 
            queryKey: [`/api/deals/${createdDeal.id}/synergies`] 
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
          // Continue with the process, the deal has been created anyway
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

  // This useEffect was causing an infinite render loop
  // because filteredSynergyContacts is already being set in another useEffect
  // and we're directly using contacts in the UI now, so we don't need this at all
  /*
  useEffect(() => {
    const options = filteredSynergyContacts
      .map(contact => ({
        value: contact.id.toString(),
        label: `${contact.firstName} ${contact.lastName}`
      }));

    setSynergyOptions(options);
  }, [filteredSynergyContacts]);
  */

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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                  defaultValue={initialData?.stageId?.toString() || (Array.isArray(stages) && stages.length > 0 ? stages[0]?.id?.toString() : undefined)}
                  onValueChange={(value) => setValue("stageId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(stages) && stages.map((stage: any) => (
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
                              (area: { companyId: number, isPrimary: boolean }) => area.companyId === company.id && area.isPrimary
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
                        const primaryArea = selectedContact.areasOfActivity.find(
                          (a: { isPrimary: boolean }) => a.isPrimary
                        ) || selectedContact.areasOfActivity[0];

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
                      filteredContacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      Array.isArray(contacts) && contacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Synergy Contacts - AsyncSelect implementation */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="synergyContactIds">Synergy Contacts</Label>
              <div className="relative">
                <Controller
                  name="synergyContactIds"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      isMulti
                      isDisabled={!selectedCompanyId}
                      placeholder={selectedCompanyId ? "Type to search contacts..." : "Select a company first"}
                      loadOptions={(inputValue) => {
                        // Assicuriamoci che ci sia un'azienda selezionata
                        return new Promise((resolve) => {
                          if (!selectedCompanyId) {
                            return resolve([]);
                          }
                          
                          // Se l'input è vuoto, mostriamo alcuni contatti di default
                          if (!inputValue || inputValue.length < 1) {
                            // Mostriamo contatti di default
                            fetch(`/api/contacts?&includeAreas=true&limit=10`)
                              .then(response => {
                                if (!response.ok) throw new Error('Failed to load default contacts');
                                return response.json();
                              })
                              .then(contacts => {
                                const options = contacts.map((contact: any) => ({
                                  value: contact.id,
                                  label: `${contact.firstName} ${contact.lastName}`,
                                  contact
                                }));
                                console.log('Default contacts loaded:', options.length);
                                resolve(options);
                              })
                              .catch(err => {
                                console.error('Error loading default contacts:', err);
                                resolve([]);
                              });
                            return;
                          }
                          
                          // Altrimenti, cerchiamo contatti che corrispondono all'input
                          console.log('Searching contacts with term:', inputValue);
                          
                          fetch(`/api/contacts?search=${encodeURIComponent(inputValue)}&excludeCompanyId=${selectedCompanyId}&includeAreas=true`)
                            .then(response => {
                              if (!response.ok) throw new Error('Failed to search contacts');
                              return response.json();
                            })
                            .then(contacts => {
                              const options = contacts.map((contact: any) => ({
                                value: contact.id,
                                label: `${contact.firstName} ${contact.lastName}`,
                                contact
                              }));
                              console.log('Found contacts:', options.length);
                              resolve(options);
                            })
                            .catch(err => {
                              console.error('Error searching contacts:', err);
                              resolve([]);
                            });
                        });
                      }}
                      onChange={(selectedOptions: any) => {
                        // Extract contact IDs from selected options
                        const contactIds = selectedOptions ? 
                          selectedOptions.map((option: any) => typeof option.value === 'string' ? parseInt(option.value) : option.value) : 
                          [];
                        
                        console.log('Selected contact IDs:', contactIds);
                        
                        // Update form state
                        field.onChange(contactIds);
                      }}
                      value={field.value.map((id: number) => {
                        // Find the contact in our data sources
                        const contactFromDealSynergies = Array.isArray(dealSynergies) ? 
                          dealSynergies.find(synergy => 
                            (typeof synergy.contactId === 'string' ? parseInt(synergy.contactId) : synergy.contactId) === id
                          ) : undefined;
                        
                        // Find the contact in the main contacts query
                        const contactFromAllContacts = Array.isArray(contacts) ? 
                          contacts.find(contact => contact.id === id) : undefined;
                        
                        // Use the first available data source
                        const contact = contactFromDealSynergies?.contact || contactFromAllContacts;
                        
                        if (!contact) {
                          // If we can't find the contact data, return a placeholder
                          return {
                            value: id,
                            label: `Contact #${id}`
                          };
                        }
                        
                        return {
                          value: id,
                          label: `${contact.firstName} ${contact.lastName}`
                        };
                      })}
                      styles={{
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: 'rgba(186, 230, 253, 0.4)', // Light blue bg (bg-blue-100)
                          color: 'rgb(7, 89, 133)', // Dark blue text (text-blue-800)
                          borderRadius: '0.25rem',
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: 'rgb(7, 89, 133)', // text-blue-800
                          padding: '0.25rem'
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: 'rgb(7, 89, 133)', // text-blue-800
                          ':hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', // hover:bg-destructive/10
                            color: 'rgb(239, 68, 68)', // hover:text-destructive
                          },
                        }),
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? 'rgb(147, 197, 253)' : 'rgb(226, 232, 240)',
                          boxShadow: state.isFocused ? '0 0 0 1px rgb(147, 197, 253)' : 'none',
                          '&:hover': {
                            borderColor: 'rgb(147, 197, 253)',
                          },
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused ? 'rgba(219, 234, 254, 0.5)' : base.backgroundColor,
                          '&:hover': {
                            backgroundColor: 'rgba(219, 234, 254, 0.5)',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999, // Ensure menu is on top
                          position: 'absolute',
                        }),
                      }}
                      className="z-50 mt-0"
                      classNamePrefix="react-select"
                      menuPosition="absolute"
                      menuPlacement="auto"
                      cacheOptions
                      defaultOptions
                      filterOption={null}
                      loadingMessage={() => "Ricerca contatti..."}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {getValues("synergyContactIds")?.length > 0 && !selectedCompanyId ? 
                    <span className="text-red-500">Company selection is required when adding synergy contacts</span> : 
                    "Type to search and select synergy contacts..."}
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