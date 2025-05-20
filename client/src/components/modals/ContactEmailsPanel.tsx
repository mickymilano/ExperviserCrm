import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2, Plus, Mail } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface ContactEmailsPanelProps {
  contactId: number;
}

interface EmailFormData {
  contactId: number;
  emailAddress: string;
  type: string;
  isPrimary: boolean;
}

export function ContactEmailsPanel({ contactId }: ContactEmailsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [emailType, setEmailType] = useState("work");
  const [isPrimary, setIsPrimary] = useState(false);
  
  // Fetch contact emails
  const { data: contactEmails = [], isLoading } = useQuery({
    queryKey: [`/api/contacts/${contactId}/emails`],
    enabled: contactId !== undefined,
  });

  // Add contact email mutation
  const addEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await fetch(`/api/contacts/${contactId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add email: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Added",
        description: "Contact email has been added successfully.",
      });
      
      // Reset form
      setNewEmail("");
      setEmailType("work");
      setIsPrimary(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}/emails`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}`]
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update email status mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ emailId, data }: { emailId: number, data: Partial<EmailFormData> }) => {
      const response = await fetch(`/api/contact-emails/${emailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update email: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Contact email has been updated successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}/emails`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}`]
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Archive email mutation
  const archiveEmailMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await fetch(`/api/contact-emails/${emailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to archive email: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Archived",
        description: "Contact email has been archived successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}/emails`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}`]
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    addEmailMutation.mutate({
      contactId,
      emailAddress: newEmail,
      type: emailType,
      isPrimary
    });
  };

  // Set primary email mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/contact-emails/${id}/set-primary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set primary email: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Primary Email Updated",
        description: "Primary email has been updated successfully."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}/emails`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/contacts/${contactId}`]
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSetPrimary = (emailId: number) => {
    setPrimaryMutation.mutate(emailId);
  };

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case "work": return "Work";
      case "personal": return "Personal";
      case "previous_work": return "Previous Work";
      case "other": return "Other";
      default: return type;
    }
  };

  const getEmailTypeBadgeColor = (type: string) => {
    switch (type) {
      case "work": return "bg-blue-100 text-blue-800";
      case "personal": return "bg-green-100 text-green-800";
      case "previous_work": return "bg-amber-100 text-amber-800";
      case "other": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Contact Email Addresses</h3>
      
      {isLoading ? (
        <div className="flex justify-center">Loading email addresses...</div>
      ) : (
        <>
          {/* Email List */}
          {contactEmails.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Primary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactEmails
                    .filter((email: any) => email.status === "active")
                    .map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {email.emailAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`font-normal ${getEmailTypeBadgeColor(email.type)}`}
                        >
                          {getEmailTypeLabel(email.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {email.isPrimary ? (
                          <Badge variant="default" className="bg-green-500">Primary</Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSetPrimary(email.id)}
                          >
                            Set Primary
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Email</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this email address?
                                This will hide it from the contact, but the data will be preserved.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => archiveEmailMutation.mutate(email.id)}
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 border rounded-md bg-muted/50">
              No email addresses found for this contact.
            </div>
          )}

          {/* Add New Email Form */}
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium mb-4">Add New Email Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newEmail">Email Address</Label>
                <Input
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="emailType">Type</Label>
                <Select
                  value={emailType}
                  onValueChange={setEmailType}
                >
                  <SelectTrigger id="emailType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="previous_work">Previous Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPrimary" className="cursor-pointer">Primary</Label>
                </div>
                <Button 
                  onClick={handleAddEmail}
                  disabled={addEmailMutation.isPending}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}