import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Meeting, Contact, Company, Deal } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useDeals } from "@/hooks/useDeals";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format, addHours, parse, set } from "date-fns";
import { cn } from "@/lib/utils";

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Meeting | null;
}

const meetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  description: z.string().nullable().optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  location: z.string().nullable().optional(),
  meetingType: z.enum(["Call", "In-Person", "Virtual"]),
  contactId: z.number().nullable().optional(),
  companyId: z.number().nullable().optional(),
  dealId: z.number().nullable().optional(),
  attendees: z.object({
    internal: z.array(z.number()).default([1]), // Default to current user (ID: 1)
    external: z.array(z.number()).default([]),
  }).optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type MeetingFormData = z.infer<typeof meetingSchema>;

export default function MeetingModal({ open, onOpenChange, initialData }: MeetingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const { deals, isLoading: isLoadingDeals } = useDeals();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: new Date(),
      endTime: addHours(new Date(), 1),
      location: "",
      meetingType: "Call",
      contactId: null,
      companyId: null,
      dealId: null,
      attendees: {
        internal: [1], // Default to current user (ID: 1)
        external: [],
      },
    }
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const startDate = new Date(initialData.startTime);
      const endDate = new Date(initialData.endTime);
      
      setDate(startDate);
      setStartTime(format(startDate, "HH:mm"));
      setEndTime(format(endDate, "HH:mm"));
      
      const formValues = {
        ...initialData,
        startTime: startDate,
        endTime: endDate,
        attendees: initialData.attendees || {
          internal: [1],
          external: [],
        },
      };
      
      form.reset(formValues);
    } else {
      const now = new Date();
      const roundedStartTime = new Date(Math.ceil(now.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000));
      const roundedEndTime = addHours(roundedStartTime, 1);
      
      setDate(roundedStartTime);
      setStartTime(format(roundedStartTime, "HH:mm"));
      setEndTime(format(roundedEndTime, "HH:mm"));
      
      form.reset({
        title: "",
        description: "",
        startTime: roundedStartTime,
        endTime: roundedEndTime,
        location: "",
        meetingType: "Call",
        contactId: null,
        companyId: null,
        dealId: null,
        attendees: {
          internal: [1],
          external: [],
        },
      });
    }
  }, [initialData, form]);

  // Update start and end times when date, startTime or endTime changes
  useEffect(() => {
    try {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const startDate = set(date, { hours: startHours, minutes: startMinutes, seconds: 0, milliseconds: 0 });
      form.setValue("startTime", startDate);

      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const endDate = set(date, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });
      form.setValue("endTime", endDate);
    } catch (error) {
      // Handle parsing errors
      console.error("Error parsing time:", error);
    }
  }, [date, startTime, endTime, form]);

  // Update external attendees when contactId changes
  useEffect(() => {
    const contactId = form.getValues("contactId");
    if (contactId) {
      const currentAttendees = form.getValues("attendees") || { internal: [1], external: [] };
      const externalAttendees = [...new Set([...currentAttendees.external, contactId])];
      form.setValue("attendees", {
        ...currentAttendees,
        external: externalAttendees,
      });
    }
  }, [form.watch("contactId")]);

  const createMeeting = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const response = await apiRequest("POST", "/api/meetings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      form.reset();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule meeting: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MeetingFormData }) => {
      const response = await apiRequest("PATCH", `/api/meetings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      form.reset();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update meeting: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: MeetingFormData) => {
    if (initialData) {
      updateMeeting.mutate({ id: initialData.id, data });
    } else {
      createMeeting.mutate(data);
    }
  };

  const isLoading = isLoadingContacts || isLoadingCompanies || isLoadingDeals;
  const isPending = createMeeting.isPending || updateMeeting.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Meeting" : "Schedule New Meeting"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div>
                <FormLabel>Date</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <FormField
                    control={form.control}
                    name="meetingType"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meeting type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="In-Person">In-Person</SelectItem>
                            <SelectItem value="Virtual">Virtual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="startTime">Start Time</FormLabel>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  {form.formState.errors.startTime && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.startTime.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="endTime">End Time</FormLabel>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  {form.formState.errors.endTime && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter meeting location" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
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
                      placeholder="Enter meeting agenda or notes"
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Contact</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={field.value?.toString()} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {contacts?.map((contact: Contact) => (
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
                    <FormLabel>Related Company</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={field.value?.toString()} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {companies?.map((company: Company) => (
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
                name="dealId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Deal</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={field.value?.toString()} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a deal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {deals?.map((deal: Deal) => (
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
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isLoading}>
                {isPending 
                  ? "Saving..." 
                  : initialData 
                    ? "Update Meeting" 
                    : "Schedule Meeting"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
