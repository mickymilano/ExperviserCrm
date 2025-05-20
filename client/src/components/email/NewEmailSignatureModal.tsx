import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { RichTextEditor } from '@/components/email/RichTextEditor';

// Import TipTap extensions
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';

interface EmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface NewEmailSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature?: EmailSignature | null;
}

// Form schema per la validazione
const formSchema = z.object({
  name: z.string().min(1, { message: 'Il nome è obbligatorio' }),
  content: z.string().min(1, { message: 'Il contenuto è obbligatorio' }),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewEmailSignatureModal({ isOpen, onClose, signature }: NewEmailSignatureModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!signature;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: signature?.name || '',
      content: signature?.content || '',
      isDefault: signature?.isDefault || false,
    },
  });

  // Mutation per creare una nuova firma
  const createSignatureMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest('POST', '/api/email/signatures', values);
    },
    onSuccess: () => {
      toast({
        title: t('emailSignatures.createSuccess'),
        description: t('emailSignatures.createSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
      onClose();
      form.reset({
        name: '',
        content: '',
        isDefault: false,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('emailSignatures.createError'),
        description: error.toString(),
      });
    }
  });

  // Mutation per aggiornare una firma esistente
  const updateSignatureMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest('PATCH', `/api/email/signatures/${signature?.id}`, values);
    },
    onSuccess: () => {
      toast({
        title: t('emailSignatures.updateSuccess'),
        description: t('emailSignatures.updateSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('emailSignatures.updateError'),
        description: error.toString(),
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateSignatureMutation.mutate(values);
    } else {
      createSignatureMutation.mutate(values);
    }
  };

  const isPending = createSignatureMutation.isPending || updateSignatureMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('emailSignatures.editTitle') : t('emailSignatures.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('emailSignatures.modalDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('emailSignatures.nameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('emailSignatures.contentLabel')}</FormLabel>
                    <FormControl>
                      <RichTextEditor 
                        content={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('emailSignatures.defaultLabel')}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}