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
import { useCreateSynergy, useUpdateSynergy } from "@/hooks/useSynergies";

// Form schema
const formSchema = z.object({
  contactId: z.number().min(1, "Contact is required"),
  companyId: z.number().min(1, "Company is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  dealId: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  startDate: z.date(),
});

type FormData = z.infer<typeof formSchema>;

interface SynergyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  contactId?: number;
  companyId?: number;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function SynergyModal({
  open,
  onOpenChange,
  initialData,
  contactId,
  companyId,
  mode = "create",
  onSuccess,
}: SynergyModalProps) {
  const { toast } = useToast();
  const createSynergyMutation = useCreateSynergy();
  const updateSynergyMutation = useUpdateSynergy();
  
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const { deals, isLoading: isLoadingDeals } = useDeals();
  
  const contactsList = contacts || [];
  const companiesList = companies || [];
  const dealsList = deals || [];
  
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
    },
  });

  // Reset form when initialData changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (initialData) {
        const formData = {
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
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
        });
      }
    }
  }, [initialData, form, open, contactId, companyId]);

  // Update form when contactId/companyId props change
  useEffect(() => {
    if (contactId) {
      form.setValue("contactId", contactId);
    }
    if (companyId) {
      form.setValue("companyId", companyId);
    }
  }, [contactId, companyId, form]);

  const onSubmit = async (data: FormData) => {
    try {
      // Converti campi undefined a null per compatibilità con il backend
      const processedData = {
        ...data,
        description: data.description || null,
        dealId: data.dealId || null,
        status: data.status || null,
        startDate: data.startDate || new Date() // Assicuriamo che startDate non sia mai undefined
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
      console.error("Error saving synergy:", error);
      toast({
        title: "Error",
        description: "Failed to save synergy",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Business Synergy" : "Edit Business Synergy"}
          </DialogTitle>
          <DialogDescription>
            Track special business relationships between contacts and companies
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
                    disabled={!!contactId || isLoadingContacts}
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
                    disabled={!!companyId || isLoadingCompanies}
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
                  <FormLabel>Relationship Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Investor">Investor</SelectItem>
                      <SelectItem value="Advisor">Advisor</SelectItem>
                      <SelectItem value="Strategic Alliance">Strategic Alliance</SelectItem>
                      <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                      <SelectItem value="Contractor">Contractor</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
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
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
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
                  <FormLabel>Related Deal (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => 
                      field.onChange(value && value !== "null" ? parseInt(value) : null)
                    }
                    defaultValue={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a deal (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>
                      {dealsList.map((deal: any) => (
                        <SelectItem key={deal.id} value={deal.id.toString()}>
                          {deal.name}
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}