import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EmailAccount, insertEmailAccountSchema } from '@shared/schema';
import { useCreateEmailAccount, useUpdateEmailAccount } from '@/hooks/useEmailAccounts';
import { useLocation } from 'wouter';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Extend the insertEmailAccountSchema with validation
const formSchema = insertEmailAccountSchema.extend({
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// For edit mode, make password and confirmPassword optional
const editFormSchema = insertEmailAccountSchema.extend({
  password: z.string().optional(),
  confirmPassword: z.string().optional()
}).refine((data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

interface EmailAccountFormProps {
  onSuccess?: () => void;
  account?: EmailAccount;
}

export function EmailAccountForm({ onSuccess, account }: EmailAccountFormProps) {
  const [, navigate] = useLocation();
  const isEditMode = !!account;
  const createAccount = useCreateEmailAccount();
  const updateAccount = useUpdateEmailAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: Partial<FormValues | EditFormValues> = {
    displayName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: true,
    userId: 1, // Default user ID - in a real app this would come from the auth context
  };

  const form = useForm<FormValues | EditFormValues>({
    resolver: zodResolver(isEditMode ? editFormSchema : formSchema),
    defaultValues: isEditMode && account 
      ? {
          ...account,
          password: '',
          confirmPassword: '',
        }
      : defaultValues,
  });

  // When in edit mode and account changes, update form values
  useEffect(() => {
    if (isEditMode && account) {
      form.reset({
        ...account,
        password: '',
        confirmPassword: '',
      });
    }
  }, [account, form, isEditMode]);

  async function onSubmit(data: FormValues | EditFormValues) {
    setIsSubmitting(true);
    try {
      // Remove confirmPassword as it's not in the server schema
      const { confirmPassword, ...accountData } = data;

      if (isEditMode && account) {
        // Remove password if empty (don't update password)
        const updateData = { ...accountData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await updateAccount.mutateAsync({ 
          id: account.id, 
          accountData: updateData 
        });
        
        // Redirect back to email settings after successful update
        navigate('/email/settings');
      } else {
        // Create new account - ensure required fields are present
        if (!accountData.password) {
          console.error('Password is required for new accounts');
          setIsSubmitting(false);
          return;
        }
        
        // Make sure all fields are properly typed
        const newAccountData = {
          displayName: accountData.displayName,
          email: accountData.email,
          username: accountData.username,
          password: accountData.password, // This is required
          imapHost: accountData.imapHost,
          imapPort: accountData.imapPort,
          imapSecure: accountData.imapSecure ?? true,
          smtpHost: accountData.smtpHost,
          smtpPort: accountData.smtpPort,
          smtpSecure: accountData.smtpSecure ?? true,
          userId: accountData.userId
        };
        
        await createAccount.mutateAsync(newAccountData);
        
        // Reset form after creation
        form.reset(defaultValues);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} email account:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper to detect common email providers and auto-fill server details
  const detectProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) return;
    
    if (domain === 'gmail.com') {
      form.setValue('imapHost', 'imap.gmail.com');
      form.setValue('imapPort', 993);
      form.setValue('imapSecure', true);
      form.setValue('smtpHost', 'smtp.gmail.com');
      form.setValue('smtpPort', 587);
      form.setValue('smtpSecure', true);
    } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
      form.setValue('imapHost', 'outlook.office365.com');
      form.setValue('imapPort', 993);
      form.setValue('imapSecure', true);
      form.setValue('smtpHost', 'smtp.office365.com');
      form.setValue('smtpPort', 587);
      form.setValue('smtpSecure', true);
    } else if (domain === 'yahoo.com') {
      form.setValue('imapHost', 'imap.mail.yahoo.com');
      form.setValue('imapPort', 993);
      form.setValue('imapSecure', true);
      form.setValue('smtpHost', 'smtp.mail.yahoo.com');
      form.setValue('smtpPort', 587);
      form.setValue('smtpSecure', true);
    } else if (domain === 'experviser.com') {
      // For demo/testing purposes with experviser.com domain
      form.setValue('imapHost', 'imap.experviser.com');
      form.setValue('imapPort', 993);
      form.setValue('imapSecure', true);
      form.setValue('smtpHost', 'smtp.experviser.com');
      form.setValue('smtpPort', 587);
      form.setValue('smtpSecure', true);
    }
    
    // Auto-fill username if it's empty
    if (!form.getValues('username')) {
      form.setValue('username', email);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="john@example.com" 
                    {...field} 
                    onBlur={(e) => {
                      field.onBlur();
                      detectProvider(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Usually your full email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3">IMAP Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imapHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="imap.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imapPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Port</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 993)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="imapSecure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 mt-2">
                  <FormControl>
                    <Checkbox 
                      checked={!!field.value} 
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Use secure connection (TLS)</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3">SMTP Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtpHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Port</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="smtpSecure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 mt-2">
                  <FormControl>
                    <Checkbox 
                      checked={!!field.value} 
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Use secure connection (TLS)</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Updating Account...' : 'Adding Account...'}
              </>
            ) : (
              isEditMode ? 'Update Email Account' : 'Add Email Account'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}