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
  initialData?: any;
  onSuccess?: () => void;
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
  const isEditing = !!initialData?.id;
  
  // Get company information from URL context
  const [location] = useLocation();
  const hasCompanyContext = location.includes("/companies/");
  const companyIdFromUrl = hasCompanyContext 
    ? parseInt(location.split("/companies/")[1].split("/")[0]) 
    : undefined;
  
  // Get company name if we have a company ID
  const { data: companyData } = useQuery({
    queryKey: ["/api/companies", companyIdFromUrl],
    enabled: !!companyIdFromUrl
  });
  
  // Debug company data for structure
  console.log("Company data from query:", companyData);
  
  // Verifica la struttura dell'oggetto per accedere al nome
  const companyName = companyData ? companyData.name || '' : '';
  
  // Prepare initial tags if they exist
  const initialTags = initialData?.tags ? initialData.tags.join(", ") : "";
  const [tagsInput, setTagsInput] = useState(initialTags);
  
  // Prepare initial areas of activity if they exist
  const initialAreas = initialData?.areasOfActivity || [];
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

  // Function to handle contact creation
  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Prepare data for contact creation
      const contactData: any = { ...data };
      
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
      
      // Create the contact
      const response = await fetch("/api/contacts", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const newContact = await response.json();
      
      // Handle areas of activity
      if (newContact.id) {
        let areasToCreate = [...areasOfActivity];
        
        // Se il contatto è stato creato dalla pagina di un'azienda e abbiamo aree di attività
        // o un ID azienda, assicuriamoci di creare l'associazione
        if (areasToCreate.length === 0 && initialData?.areasOfActivity?.length > 0) {
          areasToCreate = [...initialData.areasOfActivity];
        }
        
        // Se abbiamo dati dal contesto dell'azienda ma nessuna area di attività
        if (areasToCreate.length === 0 && hasCompanyContext && companyIdFromUrl) {
          areasToCreate.push({
            companyId: companyIdFromUrl,
            companyName: companyName || '',
            role: 'Employee',
            jobDescription: `Works at ${companyName || 'the company'}`,
            isPrimary: true
          });
        }
        
        // Create all areas of activity
        for (const area of areasToCreate) {
          try {
            const response = await fetch("/api/areas-of-activity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...area,
                contactId: newContact.id
              }),
              credentials: "include"
            });
            
            if (response.ok) {
              console.log("Area di attività creata con successo");
            } else {
              const errorText = await response.text();
              console.error(`Errore durante la creazione dell'area di attività: ${errorText}`);
            }
          } catch (error) {
            console.error("Errore durante la creazione di un'area di attività:", error);
          }
        }
      }
      
      return newContact;
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
      
      // Se siamo in una pagina azienda, invalidare anche i contatti di quell'azienda
      if (companyIdFromUrl) {
        queryClient.invalidateQueries({ queryKey: ["/api/companies", companyIdFromUrl, "contacts"] });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Se abbiamo callback di success, chiamala
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

  // Function to handle form submission
  const onSubmit = (data: ContactFormData) => {
    // Always use create for now (since we had issues with the edit path)
    createContactMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome e Cognome */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="required">First Name</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="First Name"
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="required">Last Name</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Last Name"
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
            
            {/* Campos adicionales */}
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                {...register("middleName")}
                placeholder="Middle Name"
              />
            </div>
            
            {/* Email / Phone section */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium mb-2">Contact Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="required">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    {...register("companyEmail")}
                    placeholder="company@example.com"
                    className={errors.companyEmail ? "border-red-500" : ""}
                  />
                  {errors.companyEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyEmail.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="privateEmail">Private Email</Label>
                  <Input
                    id="privateEmail"
                    type="email"
                    {...register("privateEmail")}
                    placeholder="private@example.com"
                    className={errors.privateEmail ? "border-red-500" : ""}
                  />
                  {errors.privateEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.privateEmail.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Mobile Phone</Label>
                  <Input
                    id="mobilePhone"
                    {...register("mobilePhone")}
                    placeholder="+123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Office Phone</Label>
                  <Input
                    id="officePhone"
                    {...register("officePhone")}
                    placeholder="+123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="privatePhone">Private Phone</Label>
                  <Input
                    id="privatePhone"
                    {...register("privatePhone")}
                    placeholder="+123456789"
                  />
                </div>
              </div>
            </div>
            
            {/* Areas of Activity manager */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium mb-2">Companies</h3>
              <AreasOfActivityManager 
                initialAreas={areasOfActivity} 
                onChange={setAreasOfActivity} 
              />
            </div>
            
            {/* Social media section */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium mb-2">Social Media</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    {...register("linkedin")}
                    placeholder="LinkedIn profile URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    {...register("facebook")}
                    placeholder="Facebook profile URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    {...register("instagram")}
                    placeholder="Instagram handle"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    {...register("tiktok")}
                    placeholder="TikTok handle"
                  />
                </div>
              </div>
            </div>
            
            {/* Tags and Notes */}
            <div className="sm:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-xs text-muted-foreground">
                  Enter tags separated by commas (e.g. important, follow-up, sales)
                </p>
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Add any additional notes here"
                  rows={4}
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
              disabled={createContactMutation.isPending}
            >
              {createContactMutation.isPending ? "Saving..." : (isEditing ? "Update Contact" : "Create Contact")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}