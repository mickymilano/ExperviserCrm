import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { ParentCompanySelector } from "@/components/ui/ParentCompanySelector";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logError, withErrorHandling } from "@/lib/errorTracking";
import { useCompanies } from "@/hooks/useCompanies";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Company | null;
}

import { Company } from "@/types";

const companySchema = z.object({
  // Campi principali
  name: z.string().min(1, "Nome azienda obbligatorio"),
  email: z.string().email("Indirizzo email non valido").optional().or(z.literal('')),
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
      
      // Campi indirizzo
      address: initialData?.address || "",
      fullAddress: initialData?.fullAddress || initialData?.address || "",
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
        method = "PATCH";
      }
      
      // Adattiamo il fetch body con solo i campi verificati
      const requestData = {
        name: companyData.name,
        address: companyData.address,
        full_address: companyData.full_address,
        email: companyData.email || "",
        phone: companyData.phone || "",
        website: companyData.website || "",
        industry: companyData.industry || "",
        country: companyData.country || "",
        parent_company_id: companyData.parentCompanyId, // Aggiunto campo per gerarchia aziendale
        tags: companyData.tags || [],
        notes: companyData.notes || "",
        status: companyData.status || "active"
      };
      
      const response = await fetch(url, {
        method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
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
      <DialogContent className="overflow-visible">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? 'Modifica Azienda' : 'Aggiungi Nuova Azienda'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="name">Nome Azienda</Label>
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
                  
                  setValue("name", place.name || value, { shouldValidate: true });
                  setValue("address", place.formatted_address || "", { shouldValidate: true });
                  setValue("fullAddress", place.formatted_address || "", { shouldValidate: true });
                  
                  const country = place.address_components?.find(c => c.types.includes('country'))?.long_name;
                  if (country) setValue("country", country, { shouldValidate: true });
                  
                  trigger(["name","address","fullAddress","country"]);
                }
              }}
              placeholder="Cerca nome azienda…"
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
          
          {/* Country field */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="country">Paese</Label>
            <Input 
              id="country" 
              {...register("country")} 
              placeholder="Inserisci il paese" 
            />
          </div>

          {/* Full Address Field (campo normale senza autocomplete) */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="fullAddress">Indirizzo</Label>
            <Input 
              id="fullAddress"
              {...register("fullAddress")}
              onChange={(e) => {
                // Aggiorna anche il campo address per retrocompatibilità
                setValue("address", e.target.value, { shouldValidate: true });
              }}
              placeholder="Inserisci l'indirizzo completo" 
              className="w-full"
            />
          </div>
          
          {/* DEPRECATED: Old address field hidden with comment about deprecation */}
          <div className="hidden">
            <Label htmlFor="address">Old Address (DEPRECATED)</Label>
            <Input id="address" {...register("address")} />
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
          
          {/* Selezione azienda parent */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="parentCompanyId">Azienda Parent</Label>
            <ParentCompanySelector 
              initialValue={initialData?.parentCompanyId} 
              currentCompanyId={initialData?.id}
              onChange={(value) => setValue("parentCompanyId", value)}
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