import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for form validation
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().nullable().optional(),
  email: z.string().email("Please enter a valid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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
  
  // Initialize form with company data
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      industry: company.industry || "",
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      address: company.address || "",
      notes: company.notes || "",
    }
  });
  
  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // Prepare data for API
      const companyData = { ...data };
      
      // Convert tags string to array
      if (tagsInput.trim()) {
        companyData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        companyData.tags = [];
      }
      
      // Make API request
      const response = await apiRequest(
        "PATCH", 
        `/api/companies/${company.id}`, 
        companyData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company updated successfully",
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
        title: "Error",
        description: `Failed to update company: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: CompanyFormData) => {
    updateCompany.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Company Name *</Label>
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
            <Label htmlFor="industry">Industry</Label>
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone"
              {...register("phone")}
              className="mt-1"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website"
              {...register("website")}
              className="mt-1"
            />
            {errors.website && (
              <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea 
            id="address"
            {...register("address")}
            className="mt-1"
            rows={3}
          />
          {errors.address && (
            <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input 
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="mt-1"
            placeholder="retail, enterprise, partner"
          />
        </div>
        
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            id="notes"
            {...register("notes")}
            className="mt-1"
            rows={4}
          />
          {errors.notes && (
            <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}