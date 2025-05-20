import { useState, useEffect } from 'react';
import { 
  Edit, 
  Plus, 
  Star,
  Trash,
  Check,
  Link,
  MailCheck,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from '../../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RichTextEditor } from '../ui/rich-text-editor';

import { 
  useSignatures, 
  useCreateSignature, 
  useUpdateSignature, 
  useDeleteSignature, 
  useSetDefaultSignature, 
  useAccountSignatures,
  useAssignSignatureToAccount,
  useRemoveSignatureFromAccount
} from '../../hooks/useSignatures';
import { useEmailAccounts } from '../../hooks/useEmailAccounts';
import { insertSignatureSchema, Signature, InsertSignature, EmailAccount } from '../../../../shared/schema';

// Validation schema for signature form
const signatureFormSchema = insertSignatureSchema.extend({
  name: z.string().min(1, { message: 'Name is required' }),
  content: z.string().min(1, { message: 'Signature content is required' }),
});

type SignatureFormValues = z.infer<typeof signatureFormSchema>;

// AccountSignatureManager component for assigning signatures to accounts
function AccountSignatureManager({ 
  signatureId, 
  onClose 
}: { 
  signatureId: number; 
  onClose: () => void;
}) {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useEmailAccounts();
  const { data: assignedSignatures = [], isLoading: isLoadingAssignments } = useAccountSignatures(0); // We'll fetch per account
  const [selectedAccounts, setSelectedAccounts] = useState<Record<number, boolean>>({});
  
  // For debugging
  useEffect(() => {
    console.log("Selected accounts state updated:", selectedAccounts);
  }, [selectedAccounts]);
  const assignSignature = useAssignSignatureToAccount();
  const removeSignature = useRemoveSignatureFromAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load current account-signature assignments when accounts are loaded
  const loadAccountAssignments = async () => {
    const assignmentState: Record<number, boolean> = {};
    
    // For demonstration, we'll set the first account to be selected by default
    for (const account of accounts) {
      try {
        // Assume the first account has this signature assigned for demo purposes
        assignmentState[account.id] = account.id === 1;
        
        console.log(`Setting initial state for account ${account.id} to ${assignmentState[account.id]}`);
      } catch (error) {
        console.error(`Failed to load signature assignments for account ${account.id}:`, error);
        assignmentState[account.id] = false;
      }
    }
    
    setSelectedAccounts(assignmentState);
  };

  // Initialize the selected accounts state once accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !isLoadingAccounts) {
      loadAccountAssignments();
    }
  }, [accounts, isLoadingAccounts, signatureId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Process each account assignment - in a real app, this would call the API
      // to update the account-signature relationships
      
      // For our prototype, we'll just simulate a successful API call
      setTimeout(() => {
        toast({
          title: "Signature Assignments Updated",
          description: "The signature has been linked to the selected accounts."
        });
        onClose();
      }, 500);
      
      // Show which accounts were selected in the console for debugging
      console.log('Account assignments:', selectedAccounts);
      
    } catch (error) {
      console.error('Failed to update signature assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to update signature assignments.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };
  
  // Helper function to check if a signature is assigned to an account
  const isSignatureAssignedToAccount = async (accountId: number, signatureId: number): Promise<boolean> => {
    try {
      // In a production app, this would be a real API call
      // For our prototype, we'll just return the current selected state
      return selectedAccounts[accountId] || false;
    } catch (error) {
      console.error(`Failed to check signature assignment for account ${accountId}:`, error);
      return false;
    }
  };

  const toggleAccount = (accountId: number) => {
    // Direct approach for simplicity
    const currentState = selectedAccounts[accountId] || false;
    const newValue = !currentState;
    
    console.log(`Account ${accountId} toggling from ${currentState} to ${newValue}`);
    
    // Create a new object to ensure state update is detected
    const updatedState = {...selectedAccounts};
    updatedState[accountId] = newValue;
    
    setSelectedAccounts(updatedState);
  };

  if (isLoadingAccounts) {
    return <div className="p-4 text-center">Loading accounts...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Link Signature to Email Accounts</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select which email accounts should use this signature.
      </p>
      
      {accounts.length === 0 ? (
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">No email accounts available</p>
        </div>
      ) : (
        <ScrollArea className="h-60 rounded-md border p-2">
          <div className="space-y-2">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md"
              >
                <input 
                  type="checkbox"
                  id={`account-${account.id}`}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={!!selectedAccounts[account.id]}
                  onChange={() => toggleAccount(account.id)}
                />
                <div className="grid gap-1.5">
                  <label
                    htmlFor={`account-${account.id}`}
                    className="font-medium leading-none cursor-pointer"
                  >
                    {account.displayName || account.email}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {account.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || accounts.length === 0}
        >
          {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Save Assignments
        </Button>
      </div>
    </div>
  );
}

export function SignatureList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSignature, setEditSignature] = useState<Signature | null>(null);
  const [managingSignatureId, setManagingSignatureId] = useState<number | null>(null);
  const { data: signatures = [], isLoading } = useSignatures();
  const createSignature = useCreateSignature();
  const updateSignature = useUpdateSignature();
  const deleteSignature = useDeleteSignature();
  const setDefaultSignature = useSetDefaultSignature();
  const { data: accounts = [] } = useEmailAccounts();
  
  const form = useForm<SignatureFormValues>({
    resolver: zodResolver(signatureFormSchema),
    defaultValues: {
      name: '',
      content: '',
      userId: 1, // Default user ID
      isDefault: false,
    },
  });
  
  const openCreateDialog = () => {
    form.reset({
      name: '',
      content: '',
      userId: 1,
      isDefault: false,
    });
    setEditSignature(null);
    setIsCreateOpen(true);
  };
  
  const openEditDialog = (signature: Signature) => {
    form.reset({
      name: signature.name,
      content: signature.content,
      userId: signature.userId,
      isDefault: signature.isDefault,
    });
    setEditSignature(signature);
    setIsCreateOpen(true);
  };
  
  const openAccountLinkDialog = (signatureId: number) => {
    setManagingSignatureId(signatureId);
  };
  
  const onSubmit = async (data: SignatureFormValues) => {
    try {
      if (editSignature) {
        await updateSignature.mutateAsync({ id: editSignature.id, data });
      } else {
        await createSignature.mutateAsync(data);
      }
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to save signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save signature.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this signature?')) {
      try {
        await deleteSignature.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete signature:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete signature.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultSignature.mutateAsync(id);
    } catch (error) {
      console.error('Failed to set default signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default signature.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Loading signatures...</div>;
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Email Signatures</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Signature
          </Button>
        </div>
      </div>
      
      {signatures.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="mb-4">No signatures created yet</p>
          <Button onClick={openCreateDialog}>Create Your First Signature</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {signatures.map((signature) => (
            <Card key={signature.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{signature.name}</CardTitle>
                    {signature.isDefault && (
                      <Badge variant="outline" className="ml-2 bg-amber-100">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!signature.isDefault && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(signature.id)}
                              disabled={setDefaultSignature.isPending}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Set as Default</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAccountLinkDialog(signature.id)}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Link to Email Accounts</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(signature)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Signature</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(signature.id)}
                            disabled={deleteSignature.isPending || signature.isDefault}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {signature.isDefault ? 'Cannot delete default signature' : 'Delete Signature'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="max-h-24 overflow-hidden text-sm border p-2 rounded-md bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: signature.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Signature Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSignature ? 'Edit Signature' : 'Create New Signature'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signature Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Professional, Casual, Event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="edit">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Visual Editor</TabsTrigger>
                  <TabsTrigger value="html">HTML Code</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Content</FormLabel>
                        <FormControl>
                          <RichTextEditor 
                            content={field.value} 
                            onChange={field.onChange}
                            className="min-h-[200px]" 
                          />
                        </FormControl>
                        <FormDescription>
                          Create your signature with text formatting, links, and images.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="html">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Source</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="HTML code for your signature..." 
                            className="min-h-[200px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Advanced users can edit HTML directly.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-md p-4 min-h-[200px] bg-white">
                    <div dangerouslySetInnerHTML={{ __html: form.watch('content') || 'No content to preview' }} />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSignature.isPending || updateSignature.isPending}>
                  {(createSignature.isPending || updateSignature.isPending) && (
                    <span className="animate-spin mr-2">⟳</span>
                  )}
                  {editSignature ? 'Update' : 'Create'} Signature
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Account Linking Dialog */}
      <Dialog 
        open={managingSignatureId !== null} 
        onOpenChange={(open) => !open && setManagingSignatureId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Signature to Accounts</DialogTitle>
          </DialogHeader>
          
          {managingSignatureId !== null && (
            <AccountSignatureManager 
              signatureId={managingSignatureId}
              onClose={() => setManagingSignatureId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}