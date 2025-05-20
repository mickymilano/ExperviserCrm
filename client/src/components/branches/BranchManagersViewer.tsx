import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Edit, Plus, Trash2, User, Users } from "lucide-react";
import { ContactCombobox } from "@/components/ui/ContactCombobox";
import { Branch, BranchManager, Contact } from "@/types";

interface BranchManagersViewerProps {
  branch: Branch;
  onUpdate?: () => void;
}

export default function BranchManagersViewer({ branch, onUpdate }: BranchManagersViewerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<BranchManager | null>(null);
  const [managerForm, setManagerForm] = useState<Partial<BranchManager>>({
    id: "",
    name: "",
    role: "",
    contactId: ""
  });

  // Ottiene i contatti dal sistema
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: isDialogOpen
  });

  // Mutation per aggiornare una filiale
  const updateBranchMutation = useMutation({
    mutationFn: async (updatedBranch: Partial<Branch>) => {
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedBranch)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'aggiornamento della filiale');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalida la cache per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['/api/branches', branch.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches/company', branch.companyId] });
      
      toast({
        title: t('branches.managers.successUpdateTitle'),
        description: t('branches.managers.successUpdateDescription'),
      });
      
      if (onUpdate) {
        onUpdate();
      }
    },
    onError: (error) => {
      console.error('Errore nell\'aggiornamento del manager:', error);
      toast({
        variant: 'destructive',
        title: t('branches.managers.errorTitle'),
        description: t('branches.managers.errorDescription'),
      });
    }
  });

  // Aggiorna il form quando viene selezionato un manager
  useEffect(() => {
    if (selectedManager) {
      setManagerForm({
        id: selectedManager.id,
        name: selectedManager.name,
        role: selectedManager.role,
        contactId: selectedManager.contactId
      });
    } else {
      setManagerForm({
        id: crypto.randomUUID(),
        name: "",
        role: "",
        contactId: ""
      });
    }
  }, [selectedManager]);

  // Apre il dialog per l'aggiunta di un nuovo manager
  const handleAddManager = () => {
    setSelectedManager(null);
    setIsDialogOpen(true);
  };

  // Apre il dialog per la modifica di un manager esistente
  const handleEditManager = (manager: BranchManager) => {
    setSelectedManager(manager);
    setIsDialogOpen(true);
  };

  // Salva un manager (nuovo o modificato)
  const handleSaveManager = async () => {
    try {
      // Verifica se i campi obbligatori sono compilati
      if (!managerForm.name || !managerForm.role) {
        toast({
          variant: 'destructive',
          title: t('branches.managers.validationTitle'),
          description: t('branches.managers.validationDescription'),
        });
        return;
      }

      // Crea una copia dei manager attuali
      let updatedManagers = [...(branch.managers || [])];
      
      if (selectedManager) {
        // Modifica un manager esistente
        const index = updatedManagers.findIndex(m => m.id === selectedManager.id);
        if (index !== -1) {
          updatedManagers[index] = { ...managerForm } as BranchManager;
        }
      } else {
        // Aggiungi un nuovo manager
        updatedManagers.push({ ...managerForm } as BranchManager);
      }
      
      // Invia l'aggiornamento al server
      await updateBranchMutation.mutateAsync({ managers: updatedManagers });
      
      // Chiudi il dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Errore nel salvataggio del manager:', error);
    }
  };

  // Rimuove un manager
  const handleRemoveManager = async (managerId: string) => {
    try {
      // Filtra i manager per rimuovere quello selezionato
      const updatedManagers = (branch.managers || []).filter(m => m.id !== managerId);
      
      // Invia l'aggiornamento al server
      await updateBranchMutation.mutateAsync({ managers: updatedManagers });
    } catch (error) {
      console.error('Errore nella rimozione del manager:', error);
    }
  };

  // Funzione per ottenere le iniziali del nome
  const getInitials = (name: string) => {
    if (!name) return 'XX';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Funzione per trovare un contatto tramite ID
  const findContactById = (id?: string) => {
    if (!id) return null;
    return contacts.find(contact => contact.id.toString() === id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          {t('branches.managers.title')}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddManager}
          disabled={updateBranchMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('branches.managers.addButton')}
        </Button>
      </CardHeader>
      <CardContent>
        {branch.managers && branch.managers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t('branches.managers.nameColumn')}</TableHead>
                <TableHead>{t('branches.managers.roleColumn')}</TableHead>
                <TableHead className="text-right">{t('branches.managers.actionsColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branch.managers.map((manager) => {
                const contact = findContactById(manager.contactId);
                return (
                  <TableRow key={manager.id}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {manager.name}
                      {contact && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {contact.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
                        {manager.role}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditManager(manager)}
                          disabled={updateBranchMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveManager(manager.id)}
                          disabled={updateBranchMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mb-2" />
            <p className="text-sm">
              {t('branches.managers.emptyState')}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleAddManager}
              disabled={updateBranchMutation.isPending}
              className="mt-2"
            >
              {t('branches.managers.addFirstManager')}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Dialog per aggiungere/modificare manager */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedManager 
                ? t('branches.managers.editManagerTitle') 
                : t('branches.managers.addManagerTitle')}
            </DialogTitle>
            <DialogDescription>
              {selectedManager 
                ? t('branches.managers.editManagerDescription') 
                : t('branches.managers.addManagerDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="managerName" className="text-right">
                {t('branches.managers.nameLabel')}*
              </Label>
              <Input
                id="managerName"
                value={managerForm.name || ''}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="managerRole" className="text-right">
                {t('branches.managers.roleLabel')}*
              </Label>
              <Input
                id="managerRole"
                value={managerForm.role || ''}
                onChange={(e) => setManagerForm({ ...managerForm, role: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="managerContact" className="text-right">
                {t('branches.managers.contactLabel')}
              </Label>
              <div className="col-span-3">
                <ContactCombobox
                  contacts={contacts}
                  selectedContactId={managerForm.contactId?.toString() || ''}
                  onSelect={(contactId) => 
                    setManagerForm({ 
                      ...managerForm, 
                      contactId: contactId,
                      // Se abbiamo selezionato un contatto, aggiorna il nome
                      ...(contactId && {
                        name: contacts.find(c => c.id.toString() === contactId)
                          ? `${contacts.find(c => c.id.toString() === contactId)?.firstName || ''} ${contacts.find(c => c.id.toString() === contactId)?.lastName || ''}`.trim()
                          : managerForm.name
                      })
                    })
                  }
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveManager}
              disabled={updateBranchMutation.isPending}
            >
              {updateBranchMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}