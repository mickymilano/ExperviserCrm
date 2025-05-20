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
} from "../ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Email, Contact, Company, EmailAccount } from "../../types";
import { Deal } from "../../../../shared/schema";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useContacts } from "../../hooks/useContacts";
import { useCompanies } from "../../hooks/useCompanies";
import { useDeals } from "../../hooks/useDeals";
import { useEmailAccounts } from "../../hooks/useEmailAccounts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Paperclip, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link2, 
  Image 
} from "lucide-react";

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Email | null;
  replyTo?: Email | null;
}

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  from: z.string().email("From address must be a valid email"),
  to: z.array(z.string().email("Each recipient must be a valid email")).min(1, "At least one recipient is required"),
  cc: z.array(z.string().email("Each CC recipient must be a valid email")).optional(),
  bcc: z.array(z.string().email("Each BCC recipient must be a valid email")).optional(),
  accountId: z.number({
    required_error: "Email account is required",
    invalid_type_error: "Email account is required",
  }),
  contactId: z.number().nullable().optional(),
  companyId: z.number().nullable().optional(),
  dealId: z.number().nullable().optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function EmailModal({ open, onOpenChange, initialData, replyTo }: EmailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "attachments" | "properties">("compose");
  
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const { deals, isLoading: isLoadingDeals } = useDeals();
  const { data: accounts, isLoading: isLoadingAccounts } = useEmailAccounts();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      body: "",
      from: "",
      to: [],
      cc: [],
      bcc: [],
      accountId: undefined,
      contactId: null,
      companyId: null,
      dealId: null,
    }
  });

  // Set default account if available
  useEffect(() => {
    if (accounts && accounts.length > 0 && !form.getValues("accountId")) {
      form.setValue("accountId", accounts[0].id);
      form.setValue("from", accounts[0].email);
    }
  }, [accounts, form]);

  // Update form when initialData or replyTo changes
  useEffect(() => {
    if (initialData) {
      // Edit existing email
      form.reset({
        ...initialData,
        to: Array.isArray(initialData.to) ? initialData.to : [initialData.to],
        cc: initialData.cc || [],
        bcc: initialData.bcc || [],
      });
      
      setToInput(Array.isArray(initialData.to) ? initialData.to.join(", ") : initialData.to);
      setCcInput(initialData.cc?.join(", ") || "");
      setBccInput(initialData.bcc?.join(", ") || "");
    } else if (replyTo) {
      // Reply to email
      const subject = replyTo.subject.startsWith("Re:") 
        ? replyTo.subject 
        : `Re: ${replyTo.subject}`;
        
      form.reset({
        subject,
        body: `\n\n---------- Original Message ----------\nFrom: ${replyTo.from}\nDate: ${new Date(replyTo.date).toLocaleString()}\nSubject: ${replyTo.subject}\n\n${replyTo.body}`,
        from: accounts?.[0]?.email || "",
        to: [replyTo.from],
        cc: [],
        bcc: [],
        accountId: accounts?.[0]?.id,
        contactId: replyTo.contactId,
        companyId: replyTo.companyId,
        dealId: replyTo.dealId,
      });
      
      setToInput(replyTo.from);
      setCcInput("");
      setBccInput("");
    } else {
      // New email
      form.reset({
        subject: "",
        body: "",
        from: accounts?.[0]?.email || "",
        to: [],
        cc: [],
        bcc: [],
        accountId: accounts?.[0]?.id,
        contactId: null,
        companyId: null,
        dealId: null,
      });
      
      setToInput("");
      setCcInput("");
      setBccInput("");
    }
  }, [initialData, replyTo, form, accounts]);

  // Process recipients input into arrays
  const processRecipients = () => {
    // Process "to" recipients
    if (toInput) {
      const toEmails = toInput.split(",").map(email => email.trim()).filter(email => email);
      form.setValue("to", toEmails);
    } else {
      form.setValue("to", []);
    }
    
    // Process "cc" recipients
    if (ccInput) {
      const ccEmails = ccInput.split(",").map(email => email.trim()).filter(email => email);
      form.setValue("cc", ccEmails);
    } else {
      form.setValue("cc", []);
    }
    
    // Process "bcc" recipients
    if (bccInput) {
      const bccEmails = bccInput.split(",").map(email => email.trim()).filter(email => email);
      form.setValue("bcc", bccEmails);
    } else {
      form.setValue("bcc", []);
    }
  };

  // Handle account change to update the from field
  const handleAccountChange = (accountId: string) => {
    const account = accounts?.find(a => a.id === parseInt(accountId));
    if (account) {
      form.setValue("from", account.email);
    }
    form.setValue("accountId", parseInt(accountId));
  };

  const sendEmail = useMutation({
    mutationFn: async (data: EmailFormData) => {
      // This is a mock implementation since we don't have actual email sending
      // In a real app, this would send via the email API
      
      // Create a fake email record in our system
      const emailData = {
        ...data,
        date: new Date().toISOString(),
        read: true,
        messageId: `mock-${Date.now()}`,
      };
      
      const response = await apiRequest("/api/emails/send", {
        method: "POST",
        body: JSON.stringify(emailData)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      
      // Close modal and reset form
      onOpenChange(false);
      form.reset();
      setToInput("");
      setCcInput("");
      setBccInput("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EmailFormData) => {
    processRecipients();
    sendEmail.mutate(data);
  };

  const isLoading = isLoadingContacts || isLoadingCompanies || isLoadingDeals || isLoadingAccounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Componi Email</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="compose" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <Select 
                          onValueChange={handleAccountChange} 
                          defaultValue={field.value?.toString()} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select email account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts?.map((account: EmailAccount) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.displayName} &lt;{account.email}&gt;
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormItem>
                    <FormLabel htmlFor="to">To</FormLabel>
                    <FormControl>
                      <Input 
                        id="to"
                        placeholder="recipient@example.com, another@example.com" 
                        value={toInput}
                        onChange={(e) => setToInput(e.target.value)}
                      />
                    </FormControl>
                    {form.formState.errors.to && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.to.message}
                      </p>
                    )}
                  </FormItem>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel htmlFor="cc">CC</FormLabel>
                      <FormControl>
                        <Input 
                          id="cc"
                          placeholder="cc@example.com" 
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel htmlFor="bcc">BCC</FormLabel>
                      <FormControl>
                        <Input 
                          id="bcc"
                          placeholder="bcc@example.com" 
                          value={bccInput}
                          onChange={(e) => setBccInput(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oggetto</FormLabel>
                        <FormControl>
                          <Input placeholder="Email subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Rich Text Toolbar */}
                  <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write your message here"
                            className="min-h-[200px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="attachments">
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6">
                  <Paperclip className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Add Attachments</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Drag and drop files here or click to browse
                  </p>
                  <Button variant="outline" disabled>Browse Files</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Note: Email attachments are not implemented in this demo
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="properties" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contatto Collegato</FormLabel>
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
              </TabsContent>
              
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
                <Button 
                  type="submit" 
                  disabled={sendEmail.isPending || isLoading}
                  onClick={() => {
                    processRecipients();
                    setActiveTab("compose");
                  }}
                >
                  {sendEmail.isPending ? "Invio in corso..." : "Invia Email"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
