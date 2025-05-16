import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCompanies } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useCreateBranch, useUpdateBranch } from "@/hooks/useBranches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Branch, BranchManager, Contact } from "@/types";
import { ContactCombobox } from "@/components/ui/ContactCombobox";

// Schema di validazione per un manager
const managerSchema = z.object({
  id: z.string().optional(), // ID del manager (generato automaticamente)
  name: z.string().min(1, { message: "Il nome del responsabile è obbligatorio" }),
  role: z.string().min(1, { message: "Il ruolo è obbligatorio" }),
  contactId: z.string().optional() // ID del contatto collegato (opzionale)
});

// Schema di validazione per il form
const branchFormSchema = z.object({
  name: z.string().min(1, { message: "Il nome è obbligatorio" }),
  companyId: z.coerce.number(),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email({ message: "Email non valida" }).optional().nullable(),
  description: z.string().optional().nullable(),
  isHeadquarters: z.boolean().optional().default(false),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
  managers: z.array(managerSchema).optional().default([]),
  linkedinUrl: z.string().url({ message: "URL LinkedIn non valido" }).optional().nullable(),
  instagramUrl: z.string().url({ message: "URL Instagram non valido" }).optional().nullable(),
  // Campi aggiuntivi compatibili con UI
  linkedin: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  manager: z.string().optional().nullable(), // vecchio campo singolo manager, per compatibilità
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

interface BranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Branch | null;
  onClose?: () => void;
}

export default function BranchModal({
  open,
  onOpenChange,
  initialData,
  onClose,
}: BranchModalProps) {
  const { toast } = useToast();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  // Imposta il form con i valori predefiniti o vuoti
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      companyId: initialData?.companyId || 0,
      type: initialData?.type || null,
      address: initialData?.address || null,
      city: initialData?.city || null,
      region: initialData?.region || null,
      postalCode: initialData?.postalCode || null,
      country: initialData?.country || null,
      phone: initialData?.phone || null,
      email: initialData?.email || null,
      description: initialData?.description || null,
      isHeadquarters: initialData?.isHeadquarters || false,
      customFields: initialData?.customFields || null,
      website: initialData?.website || null,
      manager: initialData?.manager || null,
      managers: initialData?.managers || [],
      linkedin: initialData?.linkedin || null,
      linkedinUrl: initialData?.linkedinUrl || null,
      facebook: initialData?.facebook || null,
      instagram: initialData?.instagram || null,
      instagramUrl: initialData?.instagramUrl || null,
    },
  });

  // Aggiorna il form quando cambia initialData
  useEffect(() => {
    if (initialData) {
      const defaultValues = {
        name: initialData.name || "",
        companyId: initialData.companyId || 0,
        type: initialData.type || null,
        address: initialData.address || null,
        city: initialData.city || null,
        region: initialData.region || null,
        postalCode: initialData.postalCode || null, 
        country: initialData.country || null,
        phone: initialData.phone || null,
        email: initialData.email || null,
        description: initialData.description || null,
        isHeadquarters: initialData.isHeadquarters || false,
        customFields: initialData.customFields || null,
        website: initialData.website || null,
        manager: initialData.manager || null,
        // Supporto per i responsabili multipli
        managers: initialData.managers || [],
        linkedin: initialData.linkedin || null,
        facebook: initialData.facebook || null,
        instagram: initialData.instagram || null,
        // Adattamenti per supportare i nomi di campi nel DB
        linkedinUrl: initialData.linkedinUrl || initialData.linkedin || null,
        instagramUrl: initialData.instagramUrl || initialData.instagram || null,
      };
      form.reset(defaultValues);
    } else {
      form.reset({
        name: "",
        companyId: companies && companies.length > 0 ? companies[0].id : 0,
        type: null,
        address: null,
        city: null,
        region: null,
        postalCode: null,
        country: null,
        phone: null,
        email: null,
        description: null,
        isHeadquarters: false,
        customFields: null,
        website: null,
        manager: null,
        managers: [],
        linkedin: null,
        facebook: null,
        instagram: null,
        linkedinUrl: null,
        instagramUrl: null,
      });
    }
  }, [initialData, form, companies]);

  // Gestione form submit
  const onSubmit = async (data: BranchFormValues) => {
    try {
      // Assicuriamoci che tutti i responsabili abbiano un ID valido
      const processedManagers = data.managers?.map(manager => {
        // Se non c'è un ID, generiamo un UUID
        if (!manager.id) {
          return { ...manager, id: crypto.randomUUID() };
        }
        return manager;
      }) || [];
      
      // Sincronizziamo i campi linkedinUrl/linkedin e instagramUrl/instagram
      const processedData = {
        ...data,
        // Assicuriamoci che i campi siano sincronizzati nei due formati
        linkedin: data.linkedin || data.linkedinUrl || null,
        linkedinUrl: data.linkedinUrl || data.linkedin || null,
        instagram: data.instagram || data.instagramUrl || null,
        instagramUrl: data.instagramUrl || data.instagram || null,
        // Assicuriamoci che i manager abbiano sempre un ID
        managers: processedManagers,
        // Aggiorniamo anche il campo manager legacy per compatibilità
        manager: processedManagers.length > 0 ? processedManagers[0].name : data.manager,
      };
      
      if (initialData) {
        // Aggiorna filiale esistente
        await updateBranch.mutateAsync({
          id: initialData.id,
          ...processedData,
        });
        toast({
          title: "Filiale aggiornata",
          description: "La filiale è stata aggiornata con successo.",
        });
      } else {
        // Crea nuova filiale
        await createBranch.mutateAsync(processedData);
        toast({
          title: "Filiale creata",
          description: "La nuova filiale è stata creata con successo.",
        });
      }
      // Chiudi il modale dopo il completamento
      onOpenChange(false);
      
      // Chiama la funzione onClose se è stata fornita
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Errore durante il salvataggio della filiale:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifica Filiale" : "Aggiungi Filiale"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifica i dettagli della filiale"
              : "Compila il form per aggiungere una nuova filiale"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome filiale */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Filiale*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome della filiale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Azienda */}
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Azienda</FormLabel>
                    <Select
                      disabled={isLoadingCompanies}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona l'azienda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.map((company) => (
                          <SelectItem
                            key={company.id}
                            value={company.id.toString()}
                          >
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="headquarters">Sede Centrale</SelectItem>
                        <SelectItem value="branch">Filiale</SelectItem>
                        <SelectItem value="office">Ufficio</SelectItem>
                        <SelectItem value="factory">Stabilimento</SelectItem>
                        <SelectItem value="warehouse">Magazzino</SelectItem>
                        <SelectItem value="shop">Negozio</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Headquarters */}
              <FormField
                control={form.control}
                name="isHeadquarters"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-7">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sede Principale</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Indirizzo */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input placeholder="Via e numero civico" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Città */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input placeholder="Città" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Regione */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regione/Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Regione o provincia" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CAP */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAP</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice postale" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Paese */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paese</FormLabel>
                    <FormControl>
                      <Input placeholder="Paese" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefono */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Numero di telefono" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Indirizzo email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrizione */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrizione della filiale"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Website URL */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sito Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsabili (fino a 3) */}
              <div className="col-span-2">
                <div className="mb-2 mt-4">
                  <h3 className="text-lg font-medium">Responsabili</h3>
                  <p className="text-sm text-muted-foreground">
                    Aggiungi fino a 3 responsabili per questa filiale
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="managers"
                  render={({ field }) => {
                    // Funzione per aggiungere un nuovo responsabile
                    const addManager = () => {
                      if (field.value && field.value.length < 3) {
                        field.onChange([
                          ...field.value,
                          { id: crypto.randomUUID(), name: "", role: "", contactId: "" }
                        ]);
                      }
                    };
                    
                    // Funzione per rimuovere un responsabile
                    const removeManager = (index: number) => {
                      const newManagers = [...field.value];
                      newManagers.splice(index, 1);
                      field.onChange(newManagers);
                    };
                    
                    // Funzione per aggiornare i dati di un responsabile
                    const updateManager = (index: number, key: string, value: string) => {
                      const newManagers = [...field.value];
                      newManagers[index] = { ...newManagers[index], [key]: value };
                      field.onChange(newManagers);
                    };
                    
                    return (
                      <FormItem>
                        <div>
                          {field.value && field.value.length > 0 ? (
                            <div className="space-y-3">
                              {field.value.map((manager, index) => (
                                <div key={manager.id || index} className="flex flex-col gap-2 p-3 border rounded-md bg-muted/20">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-medium">Responsabile #{index + 1}</h4>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 px-2" 
                                      onClick={() => removeManager(index)}
                                    >
                                      Rimuovi
                                    </Button>
                                  </div>
                                  
                                  <div className="w-full">
                                    <FormLabel htmlFor={`manager-contact-${index}`}>Contatto</FormLabel>
                                    <ContactCombobox
                                      contacts={contacts || []}
                                      value={manager.contactId || ""}
                                      onChange={(value, contact) => {
                                        const fullName = contact ? `${contact.firstName} ${contact.lastName}` : "";
                                        updateManager(index, "contactId", value);
                                        updateManager(index, "name", fullName);
                                      }}
                                      placeholder="Seleziona un contatto..."
                                      disabled={isLoadingContacts}
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {manager.contactId ? "Contatto collegato" : "Nessun contatto collegato"}
                                    </div>
                                  </div>
                                  
                                  {!manager.contactId && (
                                    <div className="w-full mt-2">
                                      <FormLabel htmlFor={`manager-name-${index}`}>Nome</FormLabel>
                                      <Input
                                        id={`manager-name-${index}`}
                                        value={manager.name || ""}
                                        onChange={(e) => updateManager(index, "name", e.target.value)}
                                        placeholder="Nome del responsabile"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="w-full mt-2">
                                    <FormLabel htmlFor={`manager-role-${index}`}>Ruolo</FormLabel>
                                    <Input
                                      id={`manager-role-${index}`}
                                      value={manager.role || ""}
                                      onChange={(e) => updateManager(index, "role", e.target.value)}
                                      placeholder="Ruolo"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
                              <p className="text-sm text-muted-foreground">Nessun responsabile aggiunto</p>
                            </div>
                          )}
                          
                          {field.value && field.value.length < 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-3"
                              onClick={addManager}
                            >
                              Aggiungi Responsabile
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              
              {/* Campo legacy per compatibilità */}
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* LinkedIn URL */}
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/company/..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* LinkedinUrl - compatibilità DB */}
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL (DB)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/company/..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Facebook URL */}
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Instagram URL */}
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* InstagramUrl - compatibilità DB */}
              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL (DB)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createBranch.isPending || updateBranch.isPending}
              >
                {createBranch.isPending || updateBranch.isPending
                  ? "Salvataggio in corso..."
                  : initialData
                  ? "Aggiorna Filiale"
                  : "Crea Filiale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}