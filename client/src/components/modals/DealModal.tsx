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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useCreateSynergy } from "@/hooks/useSynergies";
import { Badge } from "@/components/ui/badge";

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
  // States for synergy contacts autocomplete
  const [selectedSynergyContacts, setSelectedSynergyContacts] = useState<string[]>([]);
  const [synergySearchTerm, setSynergySearchTerm] = useState("");
  const [synergySearchOpen, setSynergySearchOpen] = useState(false);
  const [filteredSynergyContacts, setFilteredSynergyContacts] = useState<any[]>([]);
  
  // Query for async searching of contacts
  const { data: searchedContacts = [], isLoading: isSearchingContacts } = useQuery({
    queryKey: ["/api/contacts", { search: synergySearchTerm, excludeCompanyId: selectedCompanyId }],
    queryFn: async () => {
      if (synergySearchTerm.length < 2) return [];
      
      const response = await fetch(
        `/api/contacts?search=${encodeURIComponent(synergySearchTerm)}&excludeCompanyId=${selectedCompanyId}&includeAreas=true`
      );
      
      if (!response.ok) throw new Error('Failed to search contacts');
      const contacts = await response.json();
      console.log(`Found ${contacts.length} contacts matching search "${synergySearchTerm}"`);
      return contacts;
    },
    enabled: synergySearchTerm.length >= 2 && !!selectedCompanyId && synergySearchOpen,
    staleTime: 10000, // Cache results for 10 seconds
  });

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
    } else if (stages && stages.length > 0 && open) {
      // Set default stage for new deal
      setValue("stageId", stages[0].id);
    }
  }, [initialData, stages, open, setValue]);

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
      setFilteredSynergyContacts([]);
      return;
    }
    
    // Only show contacts associated with selected company in the main contact dropdown
    const filteredContactsList = contacts.filter(contact => {
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        return false;
      }
      return contact.areasOfActivity.some(area => area.companyId === selectedCompanyId);
    });
    setFilteredContacts(filteredContactsList);
    
    // For synergy contacts, we want contacts NOT already associated with the company as primary
    const synergyContactsList = contacts.filter(contact => {
      if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
        return true; // Include contacts with no areas of activity
      }
      // Include if not already a primary contact for this company
      return !contact.areasOfActivity.some(area => 
        area.companyId === selectedCompanyId && area.isPrimary
      );
    });
    setFilteredSynergyContacts(synergyContactsList);
  }, [contacts, selectedCompanyId]);

  // This useEffect is also redundant and contributing to the infinite loop
  // We can calculate these options directly in the render function
  /*
  useEffect(() => {
    if (filteredSynergyContacts && Array.isArray(filteredSynergyContacts)) {
      const options = filteredSynergyContacts.map(contact => ({
        value: contact.id.toString(),
        label: `${contact.firstName} ${contact.lastName}`
      }));
      setSynergyOptions(options);
    } else {
      setSynergyOptions([]);
    }
  }, [filteredSynergyContacts]);
  */

  // Initialize selected synergy contacts from existing synergies when editing a deal
  useEffect(() => {
    if (isEditMode && dealSynergies && Array.isArray(dealSynergies) && dealSynergies.length > 0) {
      console.log("Loading existing synergies for edit mode:", dealSynergies);
      
      // Extract contact IDs from synergies and convert to strings for the selected state
      const contactIds = dealSynergies.map(synergy => synergy.contactId.toString());
      setSelectedSynergyContacts(contactIds);
      
      // Also set the form value with numeric IDs for submission
      setValue("synergyContactIds", dealSynergies.map(synergy => 
        typeof synergy.contactId === 'string' ? parseInt(synergy.contactId) : synergy.contactId
      ));
    }
  }, [dealSynergies, isEditMode, setValue]);

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
      setSelectedSynergyContacts([]);
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

            {/* Synergy Contacts - True type-ahead autocomplete */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="synergyContactIds">Synergy Contacts</Label>
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {/* Async autocomplete for synergy contacts */}
                  <Popover open={synergySearchOpen} onOpenChange={setSynergySearchOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative flex w-full">
                        <Input
                          id="synergyContactIds"
                          className="w-full"
                          placeholder={selectedCompanyId ? "Type to search contacts..." : "Select a company first"}
                          disabled={!selectedCompanyId}
                          value={synergySearchTerm}
                          onChange={(e) => setSynergySearchTerm(e.target.value)}
                          onFocus={() => {
                            if (selectedCompanyId) {
                              setSynergySearchOpen(true);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => {
                            if (selectedCompanyId) {
                              setSynergySearchOpen(!synergySearchOpen);
                            }
                          }}
                          disabled={!selectedCompanyId}
                        >
                          <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-4rem)] md:w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Type at least 2 characters..." 
                          value={synergySearchTerm} 
                          onValueChange={setSynergySearchTerm}
                        />
                        <CommandEmpty>
                          {synergySearchTerm.length < 2 
                            ? "Type at least 2 characters to search" 
                            : isSearchingContacts 
                              ? "Searching..."
                              : "No contacts found"}
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {isSearchingContacts && (
                            <div className="flex items-center justify-center py-2">
                              <span className="text-sm text-muted-foreground">Searching contacts...</span>
                            </div>
                          )}
                          
                          {!isSearchingContacts && searchedContacts && searchedContacts.length > 0 && (
                            searchedContacts
                              // Filter out already selected contacts
                              .filter(contact => !selectedSynergyContacts.includes(contact.id.toString()))
                              .map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={`${contact.firstName} ${contact.lastName}`}
                                  onSelect={() => {
                                    const contactId = contact.id.toString();
                                    if (!selectedSynergyContacts.includes(contactId)) {
                                      const newSelected = [...selectedSynergyContacts, contactId];
                                      setSelectedSynergyContacts(newSelected);
                                      setValue("synergyContactIds", newSelected.map(id => parseInt(id)));
                                      // Clear the search term after selection
                                      setSynergySearchTerm("");
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedSynergyContacts.includes(contact.id.toString()) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{contact.firstName} {contact.lastName}</span>
                                    {contact.companyEmail && (
                                      <span className="text-muted-foreground text-xs">
                                        {contact.companyEmail}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Display selected contacts */}
                  {selectedSynergyContacts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md bg-secondary/10">
                      {selectedSynergyContacts.map(contactId => {
                        // First try to find contact in searched contacts
                        let contact = searchedContacts?.find(c => c.id.toString() === contactId);
                        
                        // Fallback to contacts from the main query
                        if (!contact) {
                          contact = contacts?.find(c => c.id.toString() === contactId);
                        }
                        
                        if (!contact) return null;
                        
                        return (
                          <Badge 
                            key={contactId}
                            variant="secondary"
                            className="flex items-center gap-1 pl-2 pr-1 py-1"
                          >
                            {contact.firstName} {contact.lastName}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center w-4 h-4"
                              onClick={() => {
                                setSelectedSynergyContacts(prev => {
                                  const newSelected = prev.filter(id => id !== contactId);
                                  setValue("synergyContactIds", newSelected.map(id => parseInt(id)));
                                  return newSelected;
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSynergyContacts.length > 0 && !selectedCompanyId ? 
                    <span className="text-red-500">Company selection is required when adding synergy contacts</span> : 
                    "Select contacts to create synergy relationships with this deal"}
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