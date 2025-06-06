import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { MultiCombobox, ComboboxOption } from "@/components/ui/multi-combobox";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for form validation
const companySchema = z.object({
  name: z.string().min(1, "Nome azienda obbligatorio"),
  industry: z.string().nullable().optional(),
  // Reso email completamente facoltativo (può essere vuoto o formato non valido)
  email: z.union([z.string().email("Inserisci un'email valida"), z.string().length(0), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  // DEPRECATED: old address field - Added 2025-05-13 by Lead Architect: unified location
  address: z.string().nullable().optional(),
  // Added 2025-05-13 by Lead Architect: unified location field
  fullAddress: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Added new fields
  vatNumber: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  yearFounded: z.string().nullable().optional(),
  revenue: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  // Tag multipli per la relazione utente↔azienda
  relations: z.array(z.string()).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyEditFormProps {
  company: Company;
  onComplete: () => void;
}

export default function CompanyEditForm({ company, onComplete }: CompanyEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(company.tags ? company.tags.join(", ") : "");
  
  // Get custom fields from company if they exist
  const customFields = company.customFields || {};
  
  // Stato per gestire le relazioni multiple
  const [relationValues, setRelationValues] = useState<string[]>(
    // Assicuriamoci che relations sia sempre un array
    Array.isArray(company.relations) ? company.relations : []
  );
  
  // Initialize form with company data
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting } 
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      industry: company.industry || "",
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      // DEPRECATED: old address field - Added 2025-05-13 by Lead Architect: unified location
      address: company.address || "",
      // Added 2025-05-13 by Lead Architect: unified location field
      fullAddress: company.fullAddress || company.address || "",
      notes: company.notes || "",
      // Custom fields or null values for new fields
      vatNumber: customFields.vatNumber || "",
      registrationNumber: customFields.registrationNumber || "",
      size: customFields.size || "",
      yearFounded: customFields.yearFounded || "",
      revenue: customFields.revenue || "",
      // Utilizziamo country come campo principale anziché da customFields
      country: company.country || customFields.country || "",
      city: customFields.city || "",
      timezone: customFields.timezone || "",
    }
  });
  
  // Handle select field changes
  const handleSelectChange = (field: string, value: string) => {
    setValue(field as any, value, { shouldValidate: true });
  };
  
  // Gestione della selezione/deselezione delle relazioni
  const handleRelationsChange = (values: string[]) => {
    setRelationValues(values);
    setValue('relations', values, { shouldValidate: true });
    console.log('Relazioni selezionate:', values);
  };

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // Prepare data for API
      const companyData = { ...data };
      
      // Ora che il database supporta il campo relations, lo possiamo inviare
      companyData.relations = relationValues || [];
      
      // Convert tags string to array
      if (tagsInput.trim()) {
        companyData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        companyData.tags = [];
      }
      
      // Prepare customFields object
      companyData.customFields = {
        vatNumber: data.vatNumber,
        registrationNumber: data.registrationNumber,
        size: data.size,
        yearFounded: data.yearFounded,
        revenue: data.revenue,
        // Removed country from customFields as it's now a direct field on the company
        city: data.city,
        timezone: data.timezone,
      };
      
      // Ensure country is saved as a direct property of the company
      companyData.country = data.country;
      
      // Save fullAddress as a direct property of the company
      companyData.fullAddress = data.fullAddress;
      
      // Remove fields that aren't directly in the company table
      delete companyData.vatNumber;
      delete companyData.registrationNumber;
      delete companyData.size;
      delete companyData.yearFounded;
      delete companyData.revenue;
      // NON rimuoviamo più il campo country, serve per il salvataggio diretto
      // delete companyData.country;
      delete companyData.city;
      delete companyData.timezone;
      
      // Make API request
      const response = await apiRequest(
        "PATCH", 
        `/api/companies/${company.id}`, 
        companyData
      );
      
      // Return directly without calling .json()
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Azienda aggiornata con successo",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${company.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Call completion handler
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: `Impossibile aggiornare l'azienda: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: CompanyFormData) => {
    // Non inviamo il campo relations al backend poiché non è supportato nel database
    console.log('Relazioni selezionate (non inviate al backend):', relationValues);
    // Salviamo solo i campi supportati dal backend
    console.log('Invio dati al server:', data);
    updateCompany.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Basic Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Informazioni di Base</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Azienda *</Label>
              <Input 
                id="name"
                {...register("name")}
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Settore</Label>
                <Input 
                  id="industry"
                  {...register("industry")}
                  className="mt-1"
                />
                {errors.industry && (
                  <p className="text-sm text-destructive mt-1">{errors.industry.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="size">Dimensione Azienda</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("size", value)}
                  defaultValue={customFields.size || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleziona dimensione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 dipendenti</SelectItem>
                    <SelectItem value="11-50">11-50 dipendenti</SelectItem>
                    <SelectItem value="51-200">51-200 dipendenti</SelectItem>
                    <SelectItem value="201-500">201-500 dipendenti</SelectItem>
                    <SelectItem value="501-1000">501-1000 dipendenti</SelectItem>
                    <SelectItem value="1001+">1001+ dipendenti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearFounded">Anno di Fondazione</Label>
                <Input 
                  id="yearFounded"
                  {...register("yearFounded")}
                  className="mt-1"
                  placeholder="es. 2010"
                />
              </div>
              
              <div>
                <Label htmlFor="revenue">Fatturato Annuo</Label>
                <Input 
                  id="revenue"
                  {...register("revenue")}
                  className="mt-1"
                  placeholder="es. €1M - €5M"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Informazioni di Contatto</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  {...register("email")}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input 
                  id="phone"
                  {...register("phone")}
                  className="mt-1"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="website">Sito Web</Label>
              <Input 
                id="website"
                {...register("website")}
                className="mt-1"
                placeholder="https://esempio.com"
              />
              {errors.website && (
                <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Location Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Sede</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullAddress" className="flex items-center">
                <span>Indirizzo Completo</span>
                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Google Maps</span>
              </Label>
              <PlacesAutocomplete 
                id="fullAddress"
                value={watch("fullAddress") || ""}
                onChange={(value, placeDetails) => {
                  console.log("PlacesAutocomplete onChange triggered with:", { value, placeDetails });
                  
                  // Aggiorna il campo fullAddress
                  setValue("fullAddress", value, { shouldValidate: true });
                  
                  // Imposta anche il campo nascosto address per retrocompatibilità
                  setValue("address", value, { shouldValidate: true });
                  
                  // Verifica se abbiamo ricevuto i dettagli del luogo
                  if (placeDetails && placeDetails.address_components) {
                    console.log("Place details received:", placeDetails);
                    
                    // Estrae il paese dall'indirizzo per il campo nascosto country
                    const countryComponent = placeDetails.address_components.find(
                      component => component.types.includes('country')
                    );
                    
                    if (countryComponent) {
                      console.log("Paese estratto automaticamente:", countryComponent.long_name);
                      setValue("country", countryComponent.long_name, { shouldValidate: true });
                    } else {
                      // Tentativo di estrazione del paese dall'indirizzo completo
                      const addressParts = value.split(',');
                      if (addressParts.length > 0) {
                        const lastPart = addressParts[addressParts.length - 1].trim();
                        if (lastPart && lastPart.length > 1) {
                          console.log("Paese estratto da indirizzo completo:", lastPart);
                          setValue("country", lastPart, { shouldValidate: true });
                        }
                      }
                    }
                    
                    // Estrae anche la città se necessario
                    const cityComponent = placeDetails.address_components.find(
                      component => component.types.includes('locality')
                    );
                    
                    if (cityComponent && customFields) {
                      console.log("Città estratta:", cityComponent.long_name);
                      setValue("city", cityComponent.long_name, { shouldValidate: true });
                    }
                  } else {
                    console.warn("No place details available in PlacesAutocomplete onChange");
                  }
                  
                  // Forza la validazione del form
                  trigger(["fullAddress", "country"]);
                }}
                className="mt-1"
                types={['address']} // Limita la ricerca solo a indirizzi geografici
                placeholder="Cerca o inserisci l'indirizzo completo (via, CAP, città, provincia, paese)"
              />
              {errors.fullAddress && (
                <p className="text-sm text-destructive mt-1">{errors.fullAddress.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label htmlFor="timezone">Fuso Orario</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                  defaultValue={customFields.timezone || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleziona fuso orario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Europa</SelectLabel>
                      <SelectItem value="Europe/Rome">Roma</SelectItem>
                      <SelectItem value="Europe/London">Londra</SelectItem>
                      <SelectItem value="Europe/Paris">Parigi</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlino</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Nord America</SelectLabel>
                      <SelectItem value="America/New_York">New York (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (CT)</SelectItem>
                      <SelectItem value="America/Denver">Denver (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PT)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Asia</SelectLabel>
                      <SelectItem value="Asia/Tokyo">Giappone (JST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Cina (CST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
              
            {/* DEPRECATED: Hidden fields for backward compatibility */}
            <div className="hidden">
              <Input 
                id="address"
                {...register("address")}
              />
              <Input 
                id="city"
                {...register("city")}
              />
              <Input 
                id="country"
                {...register("country")}
              />
            </div>
          </div>
        </div>
        
        {/* Relazioni Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Relazioni con me</h3>
          <p className="text-sm text-gray-500 mb-2">Seleziona tutti i tipi di relazione che hai con questa azienda. È possibile selezionare più opzioni contemporaneamente.</p>
          <div className="p-3 border rounded-md bg-gray-50">
            <MultiCombobox
              options={[
                { value: 'prospect', label: 'In fase di valutazione' },
                { value: 'clienteAttivo', label: 'Cliente attivo' },
                { value: 'exCliente', label: 'Ex-cliente' },
                { value: 'mandante', label: 'Mandante' },
                { value: 'clienteRitenuto', label: 'Cliente retainer' },
                { value: 'clienteUnaTantum', label: 'Cliente una tantum' },
                { value: 'segnalatore', label: 'Segnalatore' },
                { value: 'partnerStrategico', label: 'Partner strategico' },
                { value: 'fornitore', label: 'Fornitore' },
                { value: 'partner', label: 'Partner' },
                { value: 'consulente', label: 'Consulente' },
                { value: 'distributore', label: 'Distributore' },
                { value: 'investitore', label: 'Investitore' },
                { value: 'altro', label: 'Altro' }
              ]}
              values={relationValues}
              onChange={handleRelationsChange}
              placeholder="Seleziona le relazioni con l'azienda..."
              emptyMessage="Nessuna relazione disponibile."
            />
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Note</h3>
          <Textarea
            id="notes"
            {...register("notes")}
            className="min-h-[100px]"
            placeholder="Inserisci eventuali note sull'azienda..."
          />
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </div>
    </form>
  );
}