import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { queryClient } from '@/lib/queryClient';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { RichTextEditor } from '@/components/email/RichTextEditor';

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

const formSchema = z.object({
  name: z.string().min(1, { message: 'Il nome della firma è obbligatorio' }),
  content: z.string().min(1, { message: 'Il contenuto della firma è obbligatorio' }),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewEmailSignatureModal({ isOpen, onClose, signature }: NewEmailSignatureModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<string>('editor');
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
    ],
    content: signature?.content || '',
  });
  
  React.useEffect(() => {
    if (editor && signature?.content) {
      editor.commands.setContent(signature.content);
    }
  }, [editor, signature?.content]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: signature?.name || '',
      content: signature?.content || '',
      isDefault: signature?.isDefault || false,
    },
    mode: 'onChange',
  });

  // Update form when signature changes
  React.useEffect(() => {
    if (signature) {
      form.reset({
        name: signature.name,
        content: signature.content,
        isDefault: signature.isDefault,
      });
    } else {
      form.reset({
        name: '',
        content: '',
        isDefault: false,
      });
    }
  }, [form, signature]);

  // Create or update signature mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Get content from editor
      if (editor) {
        values.content = editor.getHTML();
      }

      const url = signature 
        ? `/api/email/signatures/${signature.id}` 
        : '/api/email/signatures';
        
      const method = signature ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Si è verificato un errore');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
      toast({
        title: signature 
          ? t('emailSignatures.updateSuccess') 
          : t('emailSignatures.createSuccess'),
        description: signature 
          ? t('emailSignatures.updateSuccessDescription') 
          : t('emailSignatures.createSuccessDescription'),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: signature 
          ? t('emailSignatures.updateError') 
          : t('emailSignatures.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Update content from editor
    if (editor) {
      values.content = editor.getHTML();
    }
    
    mutation.mutate(values);
  };

  // Preview the signature
  const handlePreviewClick = () => {
    setActiveTab('preview');
  };

  // Go back to editor
  const handleEditClick = () => {
    setActiveTab('editor');
  };

  // Effect to update form content from editor
  React.useEffect(() => {
    if (editor) {
      const updateContent = () => {
        form.setValue('content', editor.getHTML());
      };
      
      editor.on('update', updateContent);
      
      return () => {
        editor.off('update', updateContent);
      };
    }
  }, [editor, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {signature 
              ? t('emailSignatures.editTitle') 
              : t('emailSignatures.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('emailSignatures.modalDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailSignatures.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="editor">{t('emailSignatures.editorTab')}</TabsTrigger>
                <TabsTrigger value="preview">{t('emailSignatures.previewTab')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailSignatures.contentLabel')}</FormLabel>
                      <FormControl>
                        <div className="border rounded-md">
                          <RichTextEditor editor={editor} />
                          <EditorContent editor={editor} className="p-3 min-h-[150px]" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePreviewClick}
                  >
                    {t('emailSignatures.previewButton')}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="border rounded-md p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    {t('emailSignatures.previewDescription')}
                  </div>
                  <div 
                    className="p-4 border rounded-md"
                    dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
                  />
                </div>
                
                <div className="flex justify-end mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleEditClick}
                  >
                    {t('emailSignatures.editButton')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label htmlFor="isDefault">
                      {t('emailSignatures.defaultLabel')}
                    </Label>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || !form.formState.isValid}
              >
                {mutation.isPending 
                  ? t('common.saving') 
                  : signature 
                    ? t('common.save') 
                    : t('common.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}