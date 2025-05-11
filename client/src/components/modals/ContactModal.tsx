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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AreasOfActivityManager from "@/components/forms/AreasOfActivityManager";
import { InsertAreaOfActivity } from "@shared/schema";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any; // Aggiungiamo il parametro initialData
}

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  
  // Contact details
  mobilePhone: z.string().optional().nullable(),
  companyEmail: z.string().min(1, "Company email is required").email("Invalid email address"),
  privateEmail: z.string().optional().nullable().or(z.string().email("Invalid email address")),
  officePhone: z.string().optional().nullable(),
  privatePhone: z.string().optional().nullable(),
  
  // Social profiles
  linkedin: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  
  // Areas of activity will be handled separately
  areasOfActivity: z.array(z.any()).optional(),
  
  // Other fields
  middleName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactModal({ open, onOpenChange, initialData }: ContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  
  // Prepara i tag iniziali se esistono
  const initialTags = initialData?.tags ? initialData.tags.join(", ") : "";
  const [tagsInput, setTagsInput] = useState(initialTags);
  
  // Prepara le aree di attività iniziali se esistono
  const initialAreas = initialData?.areasOfActivity || [];
  const [areasOfActivity, setAreasOfActivity] = useState<Partial<InsertAreaOfActivity>[]>(initialAreas);
  
  // Debug: log initialData per vedere se arriva correttamente
  console.log("ContactModal initialData:", initialData);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      middleName: initialData?.middleName || "",
      
      // Contact details
      companyEmail: initialData?.companyEmail || "",
      privateEmail: initialData?.privateEmail || "",
      mobilePhone: initialData?.mobilePhone || "",
      officePhone: initialData?.officePhone || "",
      privatePhone: initialData?.privatePhone || "",
      
      // Social profiles
      linkedin: initialData?.linkedin || "",
      facebook: initialData?.facebook || "",
      instagram: initialData?.instagram || "",
      tiktok: initialData?.tiktok || "",
      
      // Other fields
      tags: initialData?.tags || [],
      notes: initialData?.notes || "",
      areasOfActivity: initialData?.areasOfActivity || [],
    }
  });
  
  // Aggiorniamo il form quando cambiano i dati iniziali
  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        middleName: initialData.middleName || "",
        
        // Contact details
        companyEmail: initialData.companyEmail || "",
        privateEmail: initialData.privateEmail || "",
        mobilePhone: initialData.mobilePhone || "",
        officePhone: initialData.officePhone || "",
        privatePhone: initialData.privatePhone || "",
        
        // Social profiles
        linkedin: initialData.linkedin || "",
        facebook: initialData.facebook || "",
        instagram: initialData.instagram || "",
        tiktok: initialData.tiktok || "",
        
        // Other fields
        tags: initialData.tags || [],
        notes: initialData.notes || "",
        areasOfActivity: initialData.areasOfActivity || [],
      });
      
      // Aggiorniamo anche i tag e le aree di attività
      setTagsInput(initialData.tags ? initialData.tags.join(", ") : "");
      setAreasOfActivity(initialData.areasOfActivity || []);
    }
  }, [initialData, reset]);

  // Verifichiamo se abbiamo un'azienda specifica per cui creare il contatto
  const hasCompanyContext = areasOfActivity.some(area => area.companyId);
  const companyId = hasCompanyContext ? areasOfActivity.find(area => area.companyId)?.companyId : null;
  
  // Mutazione per la creazione di un nuovo contatto, potenzialmente associato a un'azienda
  const createContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Prepariamo i dati per la creazione del contatto
      const contactData = { ...data };
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        contactData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        contactData.tags = [];
      }
      
      // Rimuovi il campo areasOfActivity poiché non fa parte dello schema
      if ('areasOfActivity' in contactData) {
        delete contactData.areasOfActivity;
      }
      
      try {
        let response;
        
        // Se abbiamo un contesto di azienda, utilizziamo l'endpoint specifico
        if (hasCompanyContext && companyId) {
          // Creiamo il contatto direttamente associato all'azienda
          response = await fetch(`/api/companies/${companyId}/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...contactData,
              // Passiamo anche il ruolo e la descrizione per l'associazione
              role: areasOfActivity.find(area => area.companyId)?.role || 'Employee',
              jobDescription: areasOfActivity.find(area => area.companyId)?.jobDescription || 
                `Works at ${areasOfActivity.find(area => area.companyId)?.companyName}`
            }),
            credentials: "include"
          });
        } else {
          // Utilizziamo l'endpoint standard per i contatti
          response = await fetch("/api/contacts", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactData),
            credentials: "include"
          });
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const newContact = await response.json();
        
        // Se non abbiamo usato l'endpoint specifico dell'azienda ma abbiamo aree di attività,
        // le creiamo manualmente
        if (!hasCompanyContext && areasOfActivity.length > 0 && newContact.id) {
          // Crea ogni area di attività per il contatto
          const areaPromises = areasOfActivity.map(area => 
            fetch("/api/areas-of-activity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...area,
                contactId: newContact.id
              }),
              credentials: "include"
            }).then(res => {
              if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
              return res.json();
            })
          );
          
          await Promise.all(areaPromises);
        }
        
        return newContact;
      } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      reset();
      setTagsInput("");
      setAreasOfActivity([]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/areas-of-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Se creato da una pagina azienda, invalida anche quella cache specifica
      if (hasCompanyContext && companyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contacts`] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create contact: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutazione per l'aggiornamento di un contatto esistente
  const updateContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!initialData || !initialData.id) {
        throw new Error("Contact ID is required for update");
      }
      
      // Prepariamo i dati per l'aggiornamento del contatto
      const contactData = { ...data };
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        contactData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        contactData.tags = [];
      }
      
      // Rimuovi il campo areasOfActivity poiché non fa parte dello schema
      if ('areasOfActivity' in contactData) {
        delete contactData.areasOfActivity;
      }
      
      try {
        // Effettua la request con il formato corretto per apiRequest
        const response = await fetch(`/api/contacts/${initialData.id}`, {
          method: "PATCH", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactData),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const updatedContact = await response.json();
        
        // Aggiorniamo le aree di attività
        // Prima eliminiamo quelle rimosse
        // Poi aggiorniamo o creiamo le nuove
        
        // Per semplicità, in questa implementazione assumiamo di ricreare tutte le aree
        // In un'implementazione più avanzata si dovrebbe ottimizzare questo processo
        
        // TODO: Gestire correttamente le aree di attività
        
        return updatedContact;
      } catch (error) {
        console.error("Error updating contact:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      
      // Close modal
      onOpenChange(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${initialData.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/areas-of-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update contact: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    if (isEditing) {
      updateContact.mutate(data);
    } else {
      createContact.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" {...register("middleName")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Details */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input id="companyEmail" type="email" {...register("companyEmail")} />
                {errors.companyEmail && (
                  <p className="text-xs text-destructive">{errors.companyEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateEmail">Private Email</Label>
                <Input id="privateEmail" type="email" {...register("privateEmail")} />
                {errors.privateEmail && (
                  <p className="text-xs text-destructive">{errors.privateEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Mobile Phone</Label>
                <Input id="mobilePhone" {...register("mobilePhone")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="officePhone">Office Phone</Label>
                <Input id="officePhone" {...register("officePhone")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privatePhone">Private Phone</Label>
                <Input id="privatePhone" {...register("privatePhone")} />
              </div>
            </div>
          </div>
          
          {/* Social Profiles */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Social Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" {...register("linkedin")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" {...register("facebook")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" {...register("instagram")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" {...register("tiktok")} />
              </div>
            </div>
          </div>
          
          {/* Areas of Activity */}
          <div className="mb-6">
            <AreasOfActivityManager 
              initialAreas={initialAreas}
              onChange={setAreasOfActivity}
            />
          </div>
          
          {/* Other Information */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Additional Information</h3>
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
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setAreasOfActivity([]);
                setTagsInput("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createContact.isPending || updateContact.isPending}
            >
              {isEditing
                ? (updateContact.isPending ? 'Updating...' : 'Update Contact')
                : (createContact.isPending ? 'Adding...' : 'Add Contact')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
