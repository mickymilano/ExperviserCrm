import { useMutation, useQuery } from '@tanstack/react-query';
import { Email } from '@shared/schema';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from './use-toast';

export const useEmails = () => {
  return useQuery<Email[]>({
    queryKey: ['/api/emails'],
  });
};

export const useEmail = (id: number) => {
  return useQuery<Email>({
    queryKey: ['/api/emails', id],
    enabled: !!id,
  });
};

export const useMarkEmailAsRead = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/emails/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({}), // Empty body, but needed to make it a valid fetch request
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error) => {
      console.error('Failed to mark email as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark email as read.',
        variant: 'destructive',
      });
    },
  });
};

export const useSendEmail = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailData: {
      accountId: number;
      to: string[];
      subject: string;
      body: string;
      cc?: string[];
      bcc?: string[];
      contactId?: number;
      companyId?: number;
      dealId?: number;
    }) => {
      return apiRequest('/api/emails/send', {
        method: 'POST',
        body: JSON.stringify(emailData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    },
  });
};