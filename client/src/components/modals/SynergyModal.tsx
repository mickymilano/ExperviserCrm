// DISABLED: Synergy creation only allowed in Deal context.
// Questo file è stato disabilitato per garantire che le sinergie possano essere create solo nel contesto di un Deal.
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useDeals } from "@/hooks/useDeals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Form schema
const formSchema = z.object({
  contactId: z.number().min(1, "Contact is required"),
  companyId: z.number().min(1, "Company is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  dealId: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface SynergyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  contactId?: number;
  companyId?: number;
  mode?: "create" | "edit" | "view";
  onSuccess?: () => void;
}

// DISABLED: Synergy creation only allowed in Deal context.
export function SynergyModal({
  open,
  onOpenChange,
  initialData,
  contactId,
  companyId,
  mode = "create",
  onSuccess,
}: SynergyModalProps) {
  // Mostriamo un messaggio di deprecazione
  useEffect(() => {
    if (open) {
      console.warn("DEPRECATED: SynergyModal è stato disabilitato. Le sinergie possono essere create solo nel contesto Deal.");
      onOpenChange(false); // Chiudiamo automaticamente il modale
    }
  }, [open, onOpenChange]);
  
  // Mock di funzionalità disabilitata
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create synergy mutation
  const createSynergyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Convert dates to string format YYYY-MM-DD
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
      };
      
      const response = await fetch('/api/synergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create synergy');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
    },
  });
  
  // Update synergy mutation
  const updateSynergyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      // Convert dates to string format YYYY-MM-DD
      const formattedData = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
        endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
      };
      
      const response = await fetch(`/api/synergies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update synergy');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
    },
  });
  
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const { deals, isLoading: isLoadingDeals } = useDeals();
  
  const contactsList = contacts || [];
  const companiesList = companies || [];
  const dealsList = deals || [];
  
  // Flag per disabilitare tutti i campi in modalità view
  const isViewMode = mode === "view";
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactId: contactId || 0,
      companyId: companyId || 0,
      type: "",
      description: "",
      dealId: null,
      status: "Active",
      startDate: new Date(),
      endDate: null,
    },
  });

  // Reset form when initialData changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (initialData) {
        const formData = {
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          endDate: initialData.endDate ? new Date(initialData.endDate) : null,
        };
        form.reset(formData);
      } else {
        // Reset to default values when opening in create mode
        form.reset({
          contactId: contactId || 0,
          companyId: companyId || 0,
          type: "",
          description: "",
          dealId: null,
          status: "Active",
          startDate: new Date(),
          endDate: null,
        });
      }
    }
  }, [open, initialData, form, contactId, companyId]);

  // Set contactId and companyId if provided as props
  useEffect(() => {
    if (contactId) {
      form.setValue("contactId", contactId);
    }
    if (companyId) {
      form.setValue("companyId", companyId);
    }
  }, [contactId, companyId, form]);

  const onSubmit = async (data: FormData) => {
    // If in view mode, don't submit the form
    if (isViewMode) {
      onOpenChange(false);
      return;
    }
    
    try {
      // Convert undefined fields to null for backend compatibility
      const processedData = {
        ...data,
        description: data.description || null,
        dealId: data.dealId || null,
        status: data.status || null,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || null,
      };
      
      if (mode === "create") {
        await createSynergyMutation.mutateAsync(processedData);
        toast({
          title: "Success",
          description: "Synergy created successfully",
        });
      } else {
        await updateSynergyMutation.mutateAsync({
          id: initialData.id,
          data: processedData,
        });
        toast({
          title: "Success",
          description: "Synergy updated successfully",
        });
      }
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" 
              ? "Create New Synergy" 
              : mode === "view" 
                ? "View Synergy" 
                : "Edit Synergy"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new business relationship between a contact and a company"
              : mode === "view"
                ? "View the details of this business relationship"
                : "Edit details of this business relationship"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Select
                    disabled={!!contactId || isLoadingContacts || isViewMode}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactsList.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select
                    disabled={!!companyId || isLoadingCompanies || isViewMode}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companiesList.map((company: any) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    disabled={isViewMode}
                    onValueChange={field.onChange} 
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a synergy type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Investor">Investor</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    disabled={isViewMode}
                    onValueChange={field.onChange}
                    defaultValue={field.value || "Active"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dealId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Deal (Optional)</FormLabel>
                  <Select
                    disabled={isViewMode}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a deal (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No associated deal</SelectItem>
                      {dealsList.map((deal: any) => (
                        <SelectItem key={deal.id} value={deal.id.toString()}>
                          {deal.name || `Deal #${deal.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          disabled={isViewMode}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isViewMode}
                      placeholder="Enter details about this business relationship"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              {mode === "view" ? (
                <Button 
                  type="button" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSynergyMutation.isPending || updateSynergyMutation.isPending}
                  >
                    {createSynergyMutation.isPending || updateSynergyMutation.isPending
                      ? "Saving..."
                      : mode === "create" 
                        ? "Create Synergy" 
                        : "Update Synergy"
                    }
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}