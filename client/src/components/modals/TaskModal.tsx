import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

// Zod schema per la validazione del task
const taskSchema = z.object({
  title: z.string().min(3, "Il titolo deve contenere almeno 3 caratteri"),
  description: z.string().optional().nullable(),
  startDateTime: z.date().optional().nullable(),
  endDateTime: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  taskValue: z.number().min(0).optional(),
  completed: z.boolean().default(false),
  assignedToId: z.number().optional().nullable(),
  contactId: z.number().optional().nullable(),
  companyId: z.number().optional().nullable(),
  dealId: z.number().optional().nullable(),
  leadId: z.number().optional().nullable(),
  isCalendarEvent: z.boolean().default(false),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // Task da modificare (se presente)
  contactId?: number; // ID contatto correlato (se aperto dalla pagina contatti)
  companyId?: number; // ID azienda correlata (se aperto dalla pagina aziende)
  leadId?: number; // ID lead correlato (se aperto dalla pagina lead)
  dealId?: number; // ID deal correlato (se aperto dalla pagina deal)
}

export default function TaskModal({
  isOpen,
  onClose,
  initialData,
  contactId,
  companyId,
  leadId,
  dealId,
}: TaskModalProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Form con validazione
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      startDateTime: null,
      endDateTime: null,
      dueDate: null,
      taskValue: 0,
      completed: false,
      assignedToId: 1, // Default all'utente corrente
      contactId: contactId || null,
      companyId: companyId || null,
      leadId: leadId || null,
      dealId: dealId || null,
      isCalendarEvent: false,
    },
  });

  // Fetch dei contatti per il select
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: isOpen,
  });

  // Fetch delle aziende per il select
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    enabled: isOpen,
  });

  // Fetch dei lead per il select
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    enabled: isOpen,
  });

  // Fetch dei deal per il select
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    enabled: isOpen,
  });

  // Se ci sono dati iniziali, popola il form
  useEffect(() => {
    if (initialData) {
      setIsUpdating(true);
      
      const formData = {
        ...initialData,
        startDateTime: initialData.startDateTime ? new Date(initialData.startDateTime) : null,
        endDateTime: initialData.endDateTime ? new Date(initialData.endDateTime) : null,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : null,
        taskValue: initialData.taskValue || 0,
      };
      
      form.reset(formData);
    } else {
      // Crea data di inizio (oggi) e data di fine (domani) come predefiniti
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Reset del form con i valori predefiniti e gli ID passati come props
      form.reset({
        title: "",
        description: "",
        startDateTime: today,
        endDateTime: tomorrow,
        dueDate: null, // dueDate non più necessario
        taskValue: 0,
        completed: false,
        assignedToId: 1,
        contactId: contactId || null,
        companyId: companyId || null,
        leadId: leadId || null,
        dealId: dealId || null,
        isCalendarEvent: false,
      });
      setIsUpdating(false);
    }
  }, [initialData, form, contactId, companyId, leadId, dealId]);

  // Mutation per la creazione di un nuovo task
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues) => apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Invalida anche le query specifiche per l'entità corrente
      if (contactId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'contact', contactId] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'company', companyId] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'lead', leadId] });
      if (dealId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'deal', dealId] });
      
      toast({
        title: "Task creato con successo",
        description: "Il task è stato aggiunto correttamente",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Errore durante la creazione del task:", error);
      toast({
        title: "Errore durante la creazione",
        description: "Si è verificato un errore durante la creazione del task. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Mutation per l'aggiornamento di un task esistente
  const updateTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/tasks/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Invalida anche le query specifiche per l'entità corrente
      if (contactId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'contact', contactId] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'company', companyId] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'lead', leadId] });
      if (dealId) queryClient.invalidateQueries({ queryKey: ['/api/tasks', 'deal', dealId] });
      
      toast({
        title: "Task aggiornato con successo",
        description: "Le modifiche sono state salvate correttamente",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Errore durante l'aggiornamento del task:", error);
      toast({
        title: "Errore durante l'aggiornamento",
        description: "Si è verificato un errore durante l'aggiornamento del task. Riprova.",
        variant: "destructive",
      });
    },
  });

  // Gestione submit del form
  const onSubmit = (data: TaskFormValues) => {
    // Verifica che entrambe le date siano impostate
    if (!data.startDateTime || !data.endDateTime) {
      toast({
        title: "Dati mancanti",
        description: "Sia la data di inizio che quella di conclusione sono obbligatorie",
        variant: "destructive",
      });
      return;
    }

    // Prepara i dati per il backend
    // Le date devono essere inviate come stringhe ISO, il backend le convertirà in oggetti Date
    const formattedData = {
      ...data,
      startDateTime: data.startDateTime ? data.startDateTime.toISOString() : null,
      endDateTime: data.endDateTime ? data.endDateTime.toISOString() : null,
      dueDate: data.endDateTime ? data.endDateTime.toISOString() : null // Usa endDateTime come dueDate per retrocompatibilità
    };

    if (isUpdating && initialData) {
      updateTaskMutation.mutate({ ...formattedData, id: initialData.id });
    } else {
      createTaskMutation.mutate(formattedData);
    }
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isUpdating ? "Modifica Task" : "Nuovo Task"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Inserisci il titolo del task" {...field} />
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
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi il task..."
                      className="h-24"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taskValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valore del Task (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isCalendarEvent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0 py-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Aggiungi al calendario
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e ora di inizio</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e ora di conclusione prevista</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="task-completed-checkbox"
                    />
                    <label htmlFor="task-completed-checkbox" className="text-sm">
                      Contrassegna come completato
                    </label>
                  </div>
                )}
              />
            </div>

            {/* I campi di date sono già presenti sopra, non serve mostrarli nuovamente per gli eventi del calendario */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contatto</FormLabel>
                    <Select
                      value={field.value?.toString() || "null"}
                      onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un contatto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nessun contatto</SelectItem>
                        {contacts.map((contact) => (
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
                    <FormLabel>Azienda</FormLabel>
                    <Select
                      value={field.value?.toString() || "null"}
                      onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un'azienda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nessuna azienda</SelectItem>
                        {companies.map((company) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dealId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal</FormLabel>
                    <Select
                      value={field.value?.toString() || "null"}
                      onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un deal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nessun deal</SelectItem>
                        {deals.map((deal) => (
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
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead</FormLabel>
                    <Select
                      value={field.value?.toString() || "null"}
                      onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nessun lead</SelectItem>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.firstName || ""} {lead.lastName || ""} {lead.companyName ? `(${lead.companyName})` : ""}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {isUpdating ? "Aggiorna" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}