import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DealInfo } from "@/types";

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DealInfo | Partial<DealInfo> | null;
}

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  stageId: z.coerce.number(),
  companyId: z.coerce.number().optional().nullable(),
  contactId: z.coerce.number().optional().nullable(),
  expectedCloseDate: z.string().optional(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealModal({ open, onOpenChange, initialData }: DealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags && initialData.tags.length > 0 ? initialData.tags.join(", ") : ""
  );
  const isEditMode = !!initialData;

  // Fetch pipeline stages for dropdown
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/pipeline-stages"],
    enabled: open,
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  // Fetch contacts for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: open,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      value: 0,
      stageId: undefined,
      companyId: undefined,
      contactId: undefined,
      expectedCloseDate: "",
      tags: [],
      notes: "",
    }
  });

  // Initialize form when in edit mode or set default stage if in create mode
  useEffect(() => {
    if (initialData && open) {
      try {
        // Set form values from the existing deal
        if (initialData.name !== undefined) setValue("name", String(initialData.name));
        if (initialData.value !== undefined) setValue("value", Number(initialData.value));
        if (initialData.stageId !== undefined) setValue("stageId", Number(initialData.stageId));
        if (initialData.companyId !== undefined) setValue("companyId", initialData.companyId !== null ? Number(initialData.companyId) : null);
        if (initialData.contactId !== undefined) setValue("contactId", initialData.contactId !== null ? Number(initialData.contactId) : null);
        
        // Format date for input field if exists
        if (initialData.expectedCloseDate) {
          const date = new Date(initialData.expectedCloseDate);
          if (!isNaN(date.getTime())) {
            setValue("expectedCloseDate", date.toISOString().split('T')[0]);
          }
        }
        
        // Set tags for display
        if (initialData.tags && Array.isArray(initialData.tags) && initialData.tags.length > 0) {
          setTagsInput(initialData.tags.join(", "));
        }
        
        if (initialData.notes !== undefined) {
          setValue("notes", initialData.notes || "");
        }
      } catch (error) {
        console.error("Error setting form values:", error);
      }
    } else if (stages && stages.length > 0 && open) {
      // Set default stage for new deal
      setValue("stageId", stages[0].id);
    }
  }, [initialData, stages, open, setValue]);

  const saveDeal = useMutation({
    mutationFn: async (data: DealFormData) => {
      // Create a new clean object for the request
      const dealData: any = {
        name: data.name,
        value: data.value,
        stageId: data.stageId,
      };
      
      // Only add optional fields if they have values
      if (data.companyId !== undefined) {
        dealData.companyId = data.companyId === null ? null : data.companyId;
      }
      
      if (data.contactId !== undefined) {
        dealData.contactId = data.contactId === null ? null : data.contactId;
      }
      
      if (data.notes) {
        dealData.notes = data.notes;
      }
      
      // Convert tags string to array if provided
      if (tagsInput.trim()) {
        dealData.tags = tagsInput.split(",").map(tag => tag.trim());
      } else {
        dealData.tags = [];
      }
      
      // Format the date for the API if it exists
      if (data.expectedCloseDate) {
        const dateObj = new Date(data.expectedCloseDate);
        if (!isNaN(dateObj.getTime())) {
          dealData.expectedCloseDate = dateObj.toISOString();
        }
      }
      
      console.log("Deal data being sent:", dealData);
      
      // Determine if we're updating or creating
      const method = isEditMode ? "PATCH" : "POST";
      const url = isEditMode ? `/api/deals/${initialData?.id}` : "/api/deals";
      
      // Make the API request
      const response = await fetch(url, {
        method: method, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Deal updated successfully" : "Deal created successfully",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      reset();
      setTagsInput("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} deal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: DealFormData) => {
    saveDeal.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{isEditMode ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="name">Deal Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" min="0" step="0.01" {...register("value")} />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stageId">Stage</Label>
              <Select 
                defaultValue={initialData?.stageId?.toString() || stages[0]?.id?.toString()}
                onValueChange={(value) => setValue("stageId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.stageId && (
                <p className="text-xs text-destructive">{errors.stageId.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <Select 
                defaultValue={initialData?.companyId?.toString() || "0"}
                onValueChange={(value) => setValue("companyId", value === "0" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactId">Contact</Label>
              <Select 
                defaultValue={initialData?.contactId?.toString() || "0"} 
                onValueChange={(value) => setValue("contactId", value === "0" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input 
              id="expectedCloseDate" 
              type="date" 
              defaultValue={initialData?.expectedCloseDate ? new Date(initialData.expectedCloseDate).toISOString().split('T')[0] : undefined}
              {...register("expectedCloseDate")} 
            />
          </div>
          
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
            <Button type="submit" disabled={saveDeal.isPending}>
              {saveDeal.isPending ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Deal' : 'Add Deal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}