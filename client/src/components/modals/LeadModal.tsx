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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  
  // Essential contact information
  mobilePhone: z.string().optional(),
  companyEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  
  // Basic lead information
  source: z.string().optional(),
  status: z.string().default("new"),
  notes: z.string().optional(),
}).refine(
  (data) => !!data.companyName || (!!data.firstName || !!data.lastName),
  {
    message: "Either company name or contact name (first or last name) is required",
    path: ["companyName"],
  }
);

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadModal({ open, onOpenChange }: LeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      role: "",
      // Essential contact information
      mobilePhone: "",
      companyEmail: "",
      // Basic lead information
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
      onOpenChange(false);
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

  const onSubmit = (data: LeadFormData) => {
    createLead.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...register("companyName")} />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
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
              <Select onValueChange={(value) => setValue("source", value)} defaultValue="website">
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
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}