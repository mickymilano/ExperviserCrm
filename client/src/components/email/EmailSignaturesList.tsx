import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Trash, Edit, Star, StarOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { queryClient } from '../../lib/queryClient';
import { useTranslation } from 'react-i18next';
import NewEmailSignatureModal from '@/components/email/NewEmailSignatureModal';

interface EmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function EmailSignaturesList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedSignature, setSelectedSignature] = React.useState<EmailSignature | null>(null);

  // Fetch signatures
  const { data: signatures = [], isLoading, error } = useQuery<EmailSignature[]>({
    queryKey: ['/api/email/signatures'],
  });

  // Delete signature mutation
  const deleteSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/email/signatures/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t('emailSignatures.deleteSuccess'),
        description: t('emailSignatures.deleteSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('emailSignatures.deleteError'),
        description: error.toString(),
      });
    },
  });

  // Set default signature mutation
  const setDefaultSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('PATCH', `/api/email/signatures/${id}/default`);
    },
    onSuccess: () => {
      toast({
        title: t('emailSignatures.defaultSuccess'),
        description: t('emailSignatures.defaultSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('emailSignatures.defaultError'),
        description: error.toString(),
      });
    },
  });

  const handleEdit = (signature: EmailSignature) => {
    setSelectedSignature(signature);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSignatureMutation.mutate(id);
  };

  const handleSetDefault = (id: number) => {
    setDefaultSignatureMutation.mutate(id);
  };

  const handleAddNew = () => {
    setSelectedSignature(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSignature(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-destructive mb-2">{t('emailSignatures.errorLoading')}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] })}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddNew}>
          {t('emailSignatures.createNew')}
        </Button>
      </div>

      {signatures.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t('emailSignatures.noSignatures')}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              {t('emailSignatures.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        signatures.map((signature: EmailSignature) => (
          <Card key={signature.id} className={signature.isDefault ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    {signature.name}
                    {signature.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                        {t('emailSignatures.default')}
                      </span>
                    )}
                  </CardTitle>
                </div>
                <div className="flex space-x-2">
                  {!signature.isDefault && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(signature.id)}
                      className="flex items-center gap-1"
                    >
                      <Star className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('emailSignatures.setAsDefault')}</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(signature)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-destructive hover:text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('common.delete')}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('emailSignatures.deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('emailSignatures.deleteConfirmDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(signature.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: signature.content }} />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <NewEmailSignatureModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        signature={selectedSignature}
      />
    </div>
  );
}