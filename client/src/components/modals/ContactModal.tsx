import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AreasOfActivityManager from "@/components/forms/AreasOfActivityManager";
import { ContactEmailsPanel } from "@/components/modals/ContactEmailsPanel";
import { InsertAreaOfActivity } from "@shared/schema";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any; // Aggiungiamo il parametro initialData
  onSuccess?: () => void; // Callback eseguita quando la creazione/modifica ha successo
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

export default function ContactModal({ open, onOpenChange, initialData, onSuccess }: ContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  
  // Get company information from URL context
  const [location] = useLocation();
  const hasCompanyContext = location.includes("/companies/");
  const companyIdFromUrl = hasCompanyContext 
    ? parseInt(location.split("/companies/")[1]) 
    : undefined;
  
  // Get company name if we have a company ID
  const { data: companyData } = useQuery({
    queryKey: ["/api/companies", companyIdFromUrl],
    enabled: !!companyIdFromUrl
  });
  const companyName = companyData?.name || '';
  
  // Prepare initial tags if they exist
  const initialTags = initialData?.tags ? initialData.tags.join(", ") : "";
  const [tagsInput, setTagsInput] = useState(initialTags);
  
  // Prepare initial areas of activity if they exist
  const initialAreas = initialData?.areasOfActivity || [];
  
  // Debug: log initialAreas
  console.log("initialAreas in AreasOfActivityManager changed:", initialAreas);
  
  // Ensure we have properly formatted areas with all required fields
  const formattedAreas = initialAreas.map((area: any) => ({
    companyId: area.companyId,
    companyName: area.companyName || '',
    isPrimary: area.isPrimary || false,
    role: area.role || '',
    jobDescription: area.jobDescription || `Works at ${area.companyName || 'Company'}`,
  }));
  
  const [areasOfActivity, setAreasOfActivity] = useState<Partial<InsertAreaOfActivity>[]>(formattedAreas);
  
  // Check if any area has company ID
  const hasAreaWithCompany = areasOfActivity.some(area => area.companyId);
  const selectedCompanyId = hasAreaWithCompany 
    ? areasOfActivity.find(area => area.companyId)?.companyId 
    : companyIdFromUrl;
  
  // Debug: log initialData
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
  
  // Update form when initial data changes
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
      
      // Update tags and areas of activity
      setTagsInput(initialData.tags ? initialData.tags.join(", ") : "");
      setAreasOfActivity(initialData.areasOfActivity || []);
    }
  }, [initialData, reset]);

  // Mutation for creating a new contact, potentially associated with a company
  const createContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Prepare data for contact creation
      // Creiamo un oggetto separato così possiamo aggiungere companyId senza problemi di tipo
      const contactData: any = { 
        ...data,
        // Aggiungiamo sempre companyId se presente nei dati iniziali
        ...(initialData?.companyId ? { companyId: initialData.companyId } : {})
      };
      
      console.log("[DEBUG] ContactModal payload:", contactData);
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        contactData.tags = tagsInput.split(",").map((tag: string) => tag.trim());
      } else {
        contactData.tags = [];
      }
      
      // Remove areasOfActivity field since it's not part of the schema
      if ('areasOfActivity' in contactData) {
        delete contactData.areasOfActivity;
      }
      
      try {
        let response;
        
        // If we have a company context, use the specific endpoint
        if (hasCompanyContext && companyIdFromUrl) {
          // Create the contact directly associated with the company
          response = await fetch(`/api/companies/${companyIdFromUrl}/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...contactData,
              // Pass role and job description for the association
              role: areasOfActivity.find(area => area.companyId === companyIdFromUrl)?.role || 'Employee',
              jobDescription: areasOfActivity.find(area => area.companyId === companyIdFromUrl)?.jobDescription || 
                `Works at ${companyName || 'the company'}`
            }),
            credentials: "include"
          });
        } else {
          // Use the standard endpoint for contacts
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
        
        // Handle areas of activity
        if (newContact.id) {
          let areasToCreate = [...areasOfActivity];
          
          // Se areasOfActivity è vuoto ma il modal è stato aperto dalla pagina di un'azienda,
          // assicuriamoci di aggiungere l'associazione all'azienda corrente
          if (areasToCreate.length === 0 && hasCompanyContext && companyIdFromUrl) {
            areasToCreate.push({
              contactId: newContact.id,
              companyId: companyIdFromUrl,
              companyName: companyName || '',
              role: 'Employee',
              jobDescription: `Works at ${companyName || 'the company'}`,
              isPrimary: true
            });
          }
          
          // Create all areas of activity
          if (areasToCreate.length > 0) {
            try {
              console.log("Creazione delle aree di attività:", areasToCreate);
              
              for (const area of areasToCreate) {
                const response = await fetch("/api/areas-of-activity", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...area,
                    contactId: newContact.id
                  }),
                  credentials: "include"
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`Errore durante la creazione dell'area di attività: ${errorText}`);
                } else {
                  console.log("Area di attività creata con successo");
                }
              }
            } catch (error) {
              console.error("Errore durante la creazione delle aree di attività:", error);
            }
          }
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
      
      // If created from a company page, invalidate that specific cache
      if (hasCompanyContext && companyIdFromUrl) {
        queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyIdFromUrl}/contacts`] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", companyIdFromUrl] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      }
      
      // Se abbiamo un callback onSuccess, eseguiamolo
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create contact: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating an existing contact
  const updateContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Check if we are in edit mode but without ID
      // This can happen when adding a new contact from a company page
      if (isEditing && (!initialData || !initialData.id)) {
        // In this case, create a new contact instead of updating
        return createContact.mutate(data);
      }
      
      // Prepare data for contact update
      const contactData = { ...data };
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        contactData.tags = tagsInput.split(",").map((tag: string) => tag.trim());
      } else {
        contactData.tags = [];
      }
      
      // Remove areasOfActivity field since it's not part of the schema
      if ('areasOfActivity' in contactData) {
        delete contactData.areasOfActivity;
      }
      
      try {
        // Make the request with the correct format for apiRequest
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
        
        // Update areas of activity
        // First get existing areas
        const existingAreasResponse = await fetch(`/api/contacts/${initialData.id}/areas-of-activity`, {
          credentials: "include"
        });
        
        if (!existingAreasResponse.ok) {
          console.warn("Failed to fetch existing areas of activity");
        } else {
          const existingAreas = await existingAreasResponse.json();
          
          // Remove all existing areas
          // This approach is simpler than calculating differences
          const deletePromises = existingAreas.map((area: any) => 
            fetch(`/api/areas-of-activity/${area.id}`, {
              method: "DELETE",
              credentials: "include"
            })
          );
          
          try {
            await Promise.all(deletePromises);
          } catch (error) {
            console.warn("Some areas could not be deleted:", error);
          }
          
          // Now create all new areas
          if (areasOfActivity.length > 0) {
            console.log("Creating areas of activity:", areasOfActivity);
            
            // Per ogni area, assicuriamoci che abbia il contactId corretto
            const areasToCreate = areasOfActivity.map(area => ({
              ...area,
              contactId: initialData.id
            }));
            
            console.log("Areas to create with correct contactId:", areasToCreate);
            
            for (const area of areasToCreate) {
              try {
                console.log(`Creating area for contact ID ${initialData.id} with company ${area.companyName || ''} (companyId: ${area.companyId || 'new'})`);
                
                // Se abbiamo un companyName ma non un companyId, dobbiamo prima creare l'azienda
                if (area.companyName && !area.companyId) {
                  console.log(`Area has company name "${area.companyName}" but no company ID. Creating new company first.`);
                  
                  const companyResponse = await fetch("/api/companies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: area.companyName }),
                    credentials: "include"
                  });
                  
                  if (!companyResponse.ok) {
                    const errorText = await companyResponse.text();
                    console.error(`Error creating company: ${companyResponse.status}: ${errorText}`);
                    throw new Error(`Failed to create company: ${errorText}`);
                  }
                  
                  const company = await companyResponse.json();
                  console.log(`Created new company: ${company.name}, ID: ${company.id}`);
                  
                  // Aggiorna l'area con il nuovo companyId
                  area.companyId = company.id;
                }
                
                // Ora crea l'area di attività
                console.log(`POSTing area of activity to /api/areas-of-activity:`, area);
                const areaResponse = await fetch("/api/areas-of-activity", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(area),
                  credentials: "include"
                });
                
                if (!areaResponse.ok) {
                  const errorText = await areaResponse.text();
                  console.error(`Error creating area: ${areaResponse.status}: ${errorText}`);
                  throw new Error(`Failed to create area of activity: ${errorText}`);
                }
                
                const areaResult = await areaResponse.json();
                console.log(`Successfully created area of activity with ID ${areaResult.id}`);
              } catch (error) {
                console.error(`Failed to create area of activity:`, error);
              }
            }
            
            // Dopo aver creato tutte le aree, aggiorna la cache di React Query
            console.log(`Invalidating queries for contact ${initialData.id}`);
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${initialData.id}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${initialData.id}/areas-of-activity`] });
          } else {
            console.log("No areas to create");
          }
        }
        
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update contact: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    if (isEditing && initialData && initialData.id) {
      // Only if we have a valid ID, perform update
      updateContact.mutate(data);
    } else {
      // Otherwise, create a new contact
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
                <Label htmlFor="companyEmail">Work Email</Label>
                <Input id="companyEmail" {...register("companyEmail")} />
                {errors.companyEmail && (
                  <p className="text-xs text-destructive">{errors.companyEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateEmail">Personal Email</Label>
                <Input id="privateEmail" {...register("privateEmail")} />
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
                <Label htmlFor="privatePhone">Home Phone</Label>
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
            <h3 className="text-md font-medium mb-3">Company Affiliations</h3>
            <AreasOfActivityManager
              contactId={initialData?.id}
              initialAreas={areasOfActivity}
              onChange={setAreasOfActivity}
            />
          </div>
          
          {/* Email Addresses Management - Only shown when editing an existing contact */}
          {isEditing && initialData?.id && (
            <div className="mb-6">
              <ContactEmailsPanel contactId={initialData.id} />
            </div>
          )}
          
          {/* Additional Information */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Additional Information</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input 
                  id="tags" 
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. vip, influencer, prospect"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  {...register("notes")} 
                  className="min-h-[100px]" 
                  placeholder="Add any additional notes about this contact..."
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createContact.isPending || updateContact.isPending}
            >
              {createContact.isPending || updateContact.isPending ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}