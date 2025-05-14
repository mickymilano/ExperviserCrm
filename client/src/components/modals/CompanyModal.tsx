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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Company | null;
}

import { Company } from "@/types";

const companySchema = z.object({
  name: z.string().min(1, "Nome azienda obbligatorio"),
  email: z.string().email("Indirizzo email non valido").optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  // DEPRECATED: old address field - Added 2025-05-13 by Lead Architect: unified location
  address: z.string().optional(),
  // Added 2025-05-13 by Lead Architect: unified location field
  fullAddress: z.string().optional(),
  // Added 2025-05-13: country field is now a direct property on companies table
  country: z.string().optional(),
  // Rimuoviamo city, region e postalCode dallo schema poiché non esistono nel database
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyModal({ open, onOpenChange, initialData }: CompanyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(initialData?.tags ? initialData.tags.join(", ") : "");
  const isEditMode = !!initialData;
  
  // Gestione speciale per evitare che il dialogo si chiuda quando si seleziona un elemento di Google Places
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.pac-container')) {
        e.stopPropagation();
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, []);

  const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      website: initialData?.website || "",
      industry: initialData?.industry || "",
      // DEPRECATED: old address field - Added 2025-05-13 by Lead Architect: unified location
      address: initialData?.address || "",
      // Added 2025-05-13 by Lead Architect: unified location field
      fullAddress: initialData?.fullAddress || initialData?.address || "",
      // Added 2025-05-13: country field is now a direct property on companies table
      country: initialData?.country || "",
      tags: initialData?.tags || [],
      notes: initialData?.notes || "",
    }
  });

  const saveCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // Prepare company data
      const companyData: any = { ...data };
      
      // Assicuriamo che name e address siano corretti
      companyData.name = data.name;           // la ragione sociale pura
      companyData.address = data.address;     // l'indirizzo completo
      delete companyData.fullAddress; // rimuovi fullAddress dal payload
      
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
      
      const response = await fetch(url, {
        method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
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
    // Log per verificare i dati inviati
    console.log("Submitting company data:", {
      name: data.name,
      address: data.fullAddress,
      country: data.country,
      tags: data.tags,
      notes: data.notes
    });
    
    saveCompany.mutate(data);
  };

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
              onChange={(value, placeDetails) => {
                console.log("PlacesAutocomplete onChange triggered for company name:", { value, placeDetails });
                
                if (placeDetails?.name) {
                  // SOLO la ragione sociale va su name
                  setValue("name", placeDetails.name, { shouldValidate: true });
                  console.log("Company name set to:", placeDetails.name);
                }
                
                if (placeDetails?.formatted_address) {
                  // L'indirizzo completo va su address (e su fullAddress, se usate entrambi)
                  setValue("address", placeDetails.formatted_address, { shouldValidate: true });
                  setValue("fullAddress", placeDetails.formatted_address, { shouldValidate: true });
                  console.log("Address set to:", placeDetails.formatted_address);
                }
                
                // Ricarica la validazione su entrambi i campi
                trigger(["name", "address", "fullAddress"]);
                
                // Estrae il paese se disponibile
                if (placeDetails?.address_components) {
                  const countryComponent = placeDetails.address_components.find(component => 
                    component.types.includes("country")
                  );
                    
                    if (countryComponent) {
                      console.log("Country found:", countryComponent.long_name);
                      setValue("country", countryComponent.long_name, { shouldValidate: true });
                    }
                    
                    // Commento: la città non è presente nello schema
                    const cityComponent = placeDetails.address_components.find(component => 
                      component.types.includes("locality") || 
                      component.types.includes("administrative_area_level_3")
                    );
                    
                    if (cityComponent) {
                      console.log("City found:", cityComponent.long_name);
                      // NON impostiamo la città perché non è nello schema e causa errori
                      // setValue("city", cityComponent.long_name, { shouldValidate: true });
                    }
                  }
                  
                  // Forza la validazione di tutti i campi aggiornati
                  trigger(["name", "fullAddress", "address", "country"]);
                }
              }}
              placeholder="Cerca aziende e attività commerciali" 
              className="w-full"
              types={["establishment"]} // Specifica che vogliamo solo aziende
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