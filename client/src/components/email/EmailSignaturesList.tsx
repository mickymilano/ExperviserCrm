import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash, Edit, Star, StarOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { queryClient } from '@/lib/queryClient';
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
      const response = await fetch(`/api/email/signatures/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della firma');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
      toast({
        title: t('emailSignatures.deleteSuccess'),
        description: t('emailSignatures.deleteSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('emailSignatures.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set default signature mutation
  const setDefaultSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/email/signatures/${id}/default`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'impostazione della firma predefinita');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
      toast({
        title: t('emailSignatures.defaultSuccess'),
        description: t('emailSignatures.defaultSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('emailSignatures.defaultError'),
        description: error.message,
        variant: 'destructive',
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSignature(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('emailSignatures.title')}</h2>
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md">
        <h2 className="text-xl font-semibold text-destructive">
          {t('emailSignatures.errorLoading')}
        </h2>
        <p className="text-destructive/80">{(error as Error).message}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] })}
        >
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('emailSignatures.title')}</h2>
        <Button onClick={() => setIsModalOpen(true)}>
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
                  <CardTitle>{signature.name}</CardTitle>
                  <CardDescription>
                    {new Date(signature.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                {signature.isDefault && (
                  <Badge variant="outline" className="border-primary text-primary">
                    {t('emailSignatures.default')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="signature-preview border rounded-md p-3 max-h-32 overflow-auto"
                dangerouslySetInnerHTML={{ __html: signature.content }}
              />
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(signature)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {!signature.isDefault && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleSetDefault(signature.id)}
                    title={t('emailSignatures.setAsDefault')}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash className="h-4 w-4 text-destructive" />
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
            </CardFooter>
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