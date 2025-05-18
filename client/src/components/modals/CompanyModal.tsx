import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logError, withErrorHandling } from "@/lib/errorTracking";
import { toSnakeCase } from "@/../../shared/mappers";
import Select from 'react-select';

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Company | null;
}

import { Company } from "@/types";

const companySchema = z.object({
  // Campi principali
  name: z.string().min(1, "Nome azienda obbligatorio"),
  // Reso email completamente facoltativo (può essere vuoto o formato non valido)
  email: z.union([z.string().email("Inserisci un'email valida"), z.string().length(0), z.null()]).optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  description: z.string().optional(),
  
  // Campi indirizzo
  address: z.string().optional(),
  fullAddress: z.string().optional(),
  country: z.string().optional(),
  
  // Campi finanziari e dimensionali
  employeeCount: z.number().int().min(0).optional().nullable(),
  annualRevenue: z.number().min(0).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  
  // Campi di relazione
  parentCompanyId: z.number().int().optional().nullable(),
  
  // Campi di stato e categorizzazione
  status: z.string().default("active"),
  isActiveRep: z.boolean().default(false),
  logoUrl: z.string().optional().nullable(),
  
  // Array
  tags: z.array(z.string()).optional().nullable(),
  brands: z.array(z.string()).optional().nullable(),
  channels: z.array(z.string()).optional().nullable(),
  productsOrServicesTags: z.array(z.string()).optional().nullable(),
  locationTypes: z.array(z.string()).optional().nullable(),
  relationshipType: z.array(z.string()).default([]),
  
  // Altri campi
  notes: z.string().optional().nullable(),
  customFields: z.any().optional().nullable(),
  linkedinUrl: z.string().optional(),
  
  // Date
  lastContactedAt: z.date().optional().nullable(),
  nextFollowUpAt: z.date().optional().nullable(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyModal({ open, onOpenChange, initialData }: CompanyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(initialData?.tags ? initialData.tags.join(", ") : "");
  const isEditMode = !!initialData;
  


  const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      // Campi principali
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      website: initialData?.website || "",
      industry: initialData?.industry || "",
      sector: initialData?.sector || "",
      description: initialData?.description || "",
      
      // Campi indirizzo (compatibilità con backend)
      address: initialData?.address || "",
      fullAddress: initialData?.fullAddress || "",
      country: initialData?.country || "",
      
      // Campi finanziari e dimensionali
      employeeCount: initialData?.employeeCount || null,
      annualRevenue: initialData?.annualRevenue || null,
      foundedYear: initialData?.foundedYear || null,
      
      // Campi di relazione
      parentCompanyId: initialData?.parentCompanyId || null,
      
      // Campi di stato e categorizzazione
      status: initialData?.status || "active",
      isActiveRep: initialData?.isActiveRep || false,
      logoUrl: initialData?.logo || null,
      
      // Array
      tags: initialData?.tags || [],
      brands: initialData?.brands || [],
      channels: initialData?.channels || [],
      productsOrServicesTags: initialData?.productsOrServicesTags || [],
      locationTypes: initialData?.locationTypes || [],
      relationshipType: Array.isArray(initialData?.relationshipType) ? initialData.relationshipType : [],
      
      // Altri campi
      notes: initialData?.notes || "",
      customFields: initialData?.customFields || null,
      linkedinUrl: initialData?.linkedinUrl || "",
      
      // Date
      lastContactedAt: initialData?.lastContactedAt || null,
      nextFollowUpAt: initialData?.nextFollowUpAt || null,
    },
    mode: "onSubmit" // Importante: valida solo al submit, non su onChange
  });

  const saveCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // Prepare company data
      const companyData: any = { ...data };
      
      // Mantieni i valori originali
      companyData.name = data.name;           // la ragione sociale pura
      companyData.address = data.address;     // l'indirizzo completo
      
      // Se manca l'indirizzo ma abbiamo fullAddress, utilizzalo
      if (!companyData.address && data.fullAddress) {
        companyData.address = data.fullAddress;
      }
      
      // Mappa correttamente l'indirizzo al campo full_address
      companyData.full_address = companyData.address;
      delete companyData.fullAddress; // se presente
      
      // Log dettagliato del payload prima dell'invio
      console.log("🔍 Payload companyData:", companyData);
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        companyData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        companyData.tags = [];
      }
      
      // Make the appropriate request based on whether we're creating or updating
      let url = "/api/companies";
      let method = "POST";
      
      if (isEditMode && initialData) {
        url = `/api/companies/${initialData.id}`;
        method = "PUT"; // Modificato da PATCH a PUT per adattarsi all'API del server
      }
      
      // Prepariamo i dati nel formato camelCase compatibile con il frontend
      const camelCaseData = {
        name: companyData.name,
        address: companyData.address,
        fullAddress: companyData.full_address, // Mappatura del campo tra frontend e backend
        email: companyData.email || "",
        phone: companyData.phone || "",
        website: companyData.website || "",
        industry: companyData.industry || "",
        sector: companyData.sector || "",
        description: companyData.description || "",
        country: companyData.country || "",
        
        // Campi finanziari e dimensionali
        employeeCount: companyData.employeeCount,
        annualRevenue: companyData.annualRevenue,
        foundedYear: companyData.foundedYear,
        
        // Campi di categorizzazione
        tags: companyData.tags || [],
        companyType: companyData.companyType || "",
        isActiveRep: companyData.isActiveRep || false,
        
        // Array
        brands: companyData.brands || [],
        channels: companyData.channels || [],
        productsOrServicesTags: companyData.productsOrServicesTags || [],
        locationTypes: companyData.locationTypes || [],
        relationshipType: Array.isArray(companyData.relationshipType) ? companyData.relationshipType : [],
        
        // Altri campi
        notes: companyData.notes || "",
        customFields: companyData.customFields || {},
        linkedinUrl: companyData.linkedinUrl || "",
        
        // Relazioni
        parentCompanyId: companyData.parentCompanyId,
        
        // Date
        lastContactedAt: companyData.lastContactedAt,
        nextFollowUpAt: companyData.nextFollowUpAt,
        
        status: companyData.status || "active"
      };
      
      // Convertiamo i dati da camelCase a snake_case prima dell'invio al server
      const snakeCaseData = toSnakeCase(camelCaseData);
      
      console.log("🔍 Dati convertiti in snake_case:", snakeCaseData);
      
      const response = await fetch(url, {
        method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snakeCaseData),
        credentials: "include"
      });
      
      // Controlla la risposta del server e logga dettagli
      const text = await response.text();
      console.log("🛠️ Response status:", response.status, text);
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${text}`);
      }
      
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: isEditMode ? "Azienda aggiornata con successo" : "Azienda creata con successo",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      reset();
      setTagsInput("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Impossibile ${isEditMode ? 'aggiornare' : 'creare'} l'azienda: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CompanyFormData) => {
    // Utilizziamo la nostra utility di tracciamento errori con withErrorHandling
    withErrorHandling(
      () => {
        // Log per verificare i dati inviati
        console.log("Dati submit company:", data);
        
        // IMPORTANTE: Verifica se ci sono dati nel form prima di inviare
        if (!data.name || data.name.trim() === '') {
          toast({
            title: "Errore di validazione",
            description: "Il nome dell'azienda è obbligatorio",
            variant: "destructive",
          });
          return;
        }
        
        // Aggiungiamo breadcrumb per tracciamento Sentry
        const context = {
          formData: {
            ...data,
            // Escludiamo eventuali dati sensibili se necessario
          },
          isEditMode,
          companyId: initialData?.id
        };
        
        // Avvia la mutazione e gestisce eventuali errori
        saveCompany.mutate(data);
      },
      // Valore di fallback: non restituisce nulla perché è void
      undefined,
      // Contesto per il tracciamento errori
      { action: 'submit_company_form', formId: initialData?.id || 'new' }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? 'Modifica Azienda' : 'Aggiungi Nuova Azienda'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="name" className="flex items-center">
              <span>Nome Azienda</span>
              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Google Maps</span>
            </Label>
            <PlacesAutocomplete 
              id="name"
              value={watch("name") || ""}
              onChange={(value, place) => {
                console.log('Place ricevuto in onChange:', value, place);
                
                if (place) {
                  console.log('Compilazione campi con:', {
                    nome: place.name || value,
                    indirizzo: place.formatted_address || "",
                    country: place.address_components?.find(c => c.types.includes('country'))?.long_name
                  });
                  
                  // Imposta nome azienda
                  setValue("name", place.name || value, { shouldValidate: true });
                  
                  // Popola fullAddress con l'indirizzo completo
                  if (place.formatted_address) {
                    setValue("fullAddress", place.formatted_address, { shouldValidate: true });
                    setValue("address", place.formatted_address, { shouldValidate: true });
                  }
                  
                  // Estrai e imposta il paese
                  const country = place.address_components?.find(c => c.types.includes('country'))?.long_name;
                  if (country) setValue("country", country, { shouldValidate: true });
                  
                  trigger(["name","address","fullAddress","country"]);
                }
              }}
              placeholder="Cerca azienda..."
              className="w-full"
              types={['establishment']}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="website">Sito Web</Label>
              <Input id="website" {...register("website")} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Settore</Label>
              <Input id="industry" {...register("industry")} />
            </div>
          </div>
          
          {/* Il campo country è ora nascosto e gestito automaticamente */}
          <input 
            type="hidden" 
            id="country" 
            {...register("country")} 
          />

          {/* Full Address Field (con autocomplete Google Maps) */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="fullAddress" className="flex items-center">
              <span>Indirizzo Completo</span>
              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Google Maps</span>
            </Label>
            <PlacesAutocomplete
              id="fullAddress"
              value={watch("fullAddress") || ""}
              onChange={(value, placeDetails) => {
                // Imposta l'indirizzo completo
                setValue("fullAddress", value, { shouldValidate: true });
                // Aggiorna anche il campo address per retrocompatibilità
                setValue("address", value, { shouldValidate: true });
                
                if (placeDetails && placeDetails.address_components) {
                  // Estrae il paese dall'indirizzo per il campo nascosto country
                  const countryComponent = placeDetails.address_components.find(c => 
                    c.types.includes('country')
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
                }
                
                trigger(["fullAddress", "address", "country"]);
              }}
              className="w-full"
              types={['address']} // Limita la ricerca solo a indirizzi geografici
              placeholder="Cerca o inserisci l'indirizzo completo (via, CAP, città, provincia, paese)"
            />
          </div>
          
          {/* DEPRECATED: Old address field hidden with comment about deprecation */}
          <div className="hidden">
            <Label htmlFor="address">Old Address (DEPRECATED)</Label>
            <Input id="address" {...register("address")} />
          </div>
          
          <div className="space-y-2 mb-4 p-2 border rounded-md bg-gray-50">
            <h3 className="font-semibold mb-1 text-sm">Relazioni con me</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                ['prospect', 'In fase di valutazione'],
                ['clienteAttivo', 'Cliente attivo'],
                ['exCliente', 'Ex-cliente'],
                ['mandante', 'Mandante'],
                ['clienteRitenuto', 'Cliente retainer'],
                ['clienteUnaTantum', 'Cliente una-tantum'],
                ['segnalatore', 'Segnalatore'],
                ['fornitore', 'Fornitore'],
                ['partnerStrategico', 'Partner strategico'],
                ['concorrente', 'Concorrente'],
                ['investitoreCliente', 'Investitore-cliente']
              ].map(([value, label]) => {
                const currentValues = Array.isArray(watch("relationshipType")) ? watch("relationshipType") : [];
                const isSelected = currentValues.includes(value);
                
                return (
                  <div key={value} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`relationship-${value}`}
                      checked={isSelected}
                      onChange={e => {
                        const newValues = e.target.checked 
                          ? [...currentValues, value]
                          : currentValues.filter(v => v !== value);
                        
                        setValue("relationshipType", newValues, { shouldValidate: true });
                      }}
                      className="h-4 w-4 mt-1 rounded border-gray-300"
                    />
                    <label 
                      htmlFor={`relationship-${value}`}
                      className="ml-2 text-xs text-gray-700 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="tags">Tag</Label>
            <Input 
              id="tags" 
              placeholder="Separa i tag con le virgole" 
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="notes">Note</Label>
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
              Annulla
            </Button>
            <Button type="submit" disabled={saveCompany.isPending}>
              {saveCompany.isPending 
                ? (isEditMode ? 'Salvataggio...' : 'Aggiunta...') 
                : (isEditMode ? 'Salva Modifiche' : 'Aggiungi Azienda')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}