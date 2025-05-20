import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeadModalProps {
  // Props for new implementation
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Props for backwards compatibility
  isOpen?: boolean;
  onClose?: () => void;
  initialData?: any;
}

const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(), // Usiamo company per allinearci allo schema backend
  role: z.string().optional(),
  
  // Essential contact information
  mobilePhone: z.string().optional(),
  companyEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  
  // Basic lead information
  source: z.string().optional(),
  status: z.string().default("new"),
  notes: z.string().optional(),
}).refine(
  (data) => !!data.company || (!!data.firstName || !!data.lastName),
  {
    message: "Either company name or contact name (first or last name) is required",
    path: ["company"],
  }
);

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadModal({ 
  open, 
  onOpenChange,
  isOpen,
  onClose,
  initialData 
}: LeadModalProps) {
  // Normalize props to support both new and old API
  const isModalOpen = open ?? isOpen ?? false;
  const handleModalClose = (newState: boolean) => {
    if (!newState) {
      if (onOpenChange) onOpenChange(false);
      if (onClose) onClose();
    } else if (onOpenChange) {
      onOpenChange(true);
    }
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");
  const isEditMode = !!initialData;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      company: initialData.company || "",
      role: initialData.role || "",
      mobilePhone: initialData.mobilePhone || "",
      companyEmail: initialData.companyEmail || "",
      source: initialData.source || "",
      status: initialData.status || "new",
      notes: initialData.notes || ""
    } : {
      firstName: "",
      lastName: "",
      company: "",
      role: "",
      mobilePhone: "",
      companyEmail: "",
      source: "",
      status: "new",
      notes: ""
    }
  });

  const createLead = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Prepariamo i dati per la creazione del lead
      const leadData = { ...data };
      
      // No tags in simplified form
      
      // Effettua la request con il formato corretto
      const response = await fetch("/api/leads", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
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
        title: "Success",
        description: "Lead created successfully",
      });
      
      // Close modal and reset form
      handleModalClose(false);
      reset();
      setTagsInput("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create lead: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateLead = useMutation({
    mutationFn: async (data: LeadFormData) => {
      if (!initialData || !initialData.id) {
        throw new Error("Cannot update lead: missing ID");
      }
      
      // Prepariamo i dati per l'aggiornamento del lead
      const leadData = { ...data };
      
      // Effettua la request di aggiornamento
      const response = await fetch(`/api/leads/${initialData.id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
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
        title: "Success",
        description: "Lead updated successfully",
      });
      
      // Close modal and reset form
      handleModalClose(false);
      reset();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${initialData?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update lead: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: LeadFormData) => {
    if (isEditMode) {
      updateLead.mutate(data);
    } else {
      createLead.mutate(data);
    }
  };

  // Support both the new Dialog component pattern as well as legacy modal pattern
  const Content = (
    <div className="sm:max-w-[500px]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{isEditMode ? "Edit Lead" : "Add New Lead"}</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2 mb-4">
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" {...register("company")} />
          {errors.company && (
            <p className="text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input id="companyEmail" type="email" {...register("companyEmail")} />
            {errors.companyEmail && (
              <p className="text-xs text-destructive">{errors.companyEmail.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobilePhone">Mobile Phone</Label>
            <Input id="mobilePhone" {...register("mobilePhone")} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" {...register("role")} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select 
              onValueChange={(value) => setValue("source", value)} 
              defaultValue={initialData?.source || "website"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="email_campaign">Email Campaign</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              handleModalClose(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isEditMode ? updateLead.isPending : createLead.isPending}
          >
            {isEditMode 
              ? (updateLead.isPending ? 'Updating...' : 'Update Lead')
              : (createLead.isPending ? 'Adding...' : 'Add Lead')
            }
          </Button>
        </div>
      </form>
    </div>
  );

  // Supporto per entrambi i pattern:
  // 1. Se è utilizzato con isOpen (vecchio pattern), renderizzare modal legacy
  // 2. Se è utilizzato con open (nuovo pattern), utilizzare Dialog
  if (isOpen !== undefined) {
    // Pattern legacy
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-[500px]">
          {Content}
        </div>
      </div>
    );
  } else {
    // Nuovo pattern con Dialog
    return (
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 mb-4">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" {...register("company")} />
              {errors.company && (
                <p className="text-xs text-destructive">{errors.company.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input id="companyEmail" type="email" {...register("companyEmail")} />
                {errors.companyEmail && (
                  <p className="text-xs text-destructive">{errors.companyEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Mobile Phone</Label>
                <Input id="mobilePhone" {...register("mobilePhone")} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" {...register("role")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select 
                  onValueChange={(value) => setValue("source", value)} 
                  defaultValue={initialData?.source || "website"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_campaign">Email Campaign</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  handleModalClose(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isEditMode ? updateLead.isPending : createLead.isPending}
              >
                {isEditMode 
                  ? (updateLead.isPending ? 'Updating...' : 'Update Lead')
                  : (createLead.isPending ? 'Adding...' : 'Add Lead')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
}