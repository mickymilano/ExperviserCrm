import { useState } from "react";
import { useLocation } from "wouter";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building, 
  Mail, 
  Phone, 
  PenTool, 
  Trash, 
  Plus, 
  MapPin,
  Linkedin,
  Instagram
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Branch } from "@/types";
import BranchModal from "@/components/modals/BranchModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CompanyBranchesListProps {
  companyId: number;
  companyName: string;
}

export default function CompanyBranchesList({ companyId, companyName }: CompanyBranchesListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Utilizziamo l'hook useBranches passando companyId per filtrare le filiali dell'azienda
  const { branches, isLoading, error, deleteBranch } = useBranches(companyId);
  
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsAddModalOpen(true);
  };
  
  const handleDelete = async (branchId: number) => {
    try {
      await deleteBranch.mutateAsync(branchId);
      toast({
        title: "Filiale eliminata",
        description: "La filiale è stata eliminata con successo",
      });
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione della filiale",
        variant: "destructive",
      });
    }
  };
  
  // Chiudi il modal dopo aver aggiunto o modificato una filiale
  const onModalClose = () => {
    setIsAddModalOpen(false);
    setEditingBranch(null);
  };

  return (
    <div>
      <BranchModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        initialData={editingBranch}
        onClose={onModalClose}
      />
    
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Filiali</h2>
          <p className="text-muted-foreground text-sm">
            {branches?.length || 0} filiali associate a {companyName}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Filiale
        </Button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="h-24 flex items-center justify-center">
              <p>Caricamento filiali...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="h-24 flex items-center justify-center">
              <p className="text-destructive">Errore nel caricamento delle filiali</p>
            </div>
          </CardContent>
        </Card>
      ) : (!branches || branches.length === 0) ? (
        <Card>
          <CardContent className="pt-6">
            <div className="h-24 flex flex-col items-center justify-center">
              <p className="mb-4">Nessuna filiale associata a quest'azienda</p>
              <Button onClick={() => setIsAddModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi la prima filiale
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Indirizzo</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <div className="font-medium">{branch.name}</div>
                      {branch.isHeadquarters && (
                        <Badge variant="outline" className="mt-1">Sede Principale</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          {branch.address ? 
                            `${branch.address}${branch.city ? `, ${branch.city}` : ''}${branch.postalCode ? ` ${branch.postalCode}` : ''}${branch.region ? ` (${branch.region})` : ''}` 
                            : 'Indirizzo non specificato'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {branch.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-xs">{branch.email}</span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-xs">{branch.phone}</span>
                          </div>
                        )}
                        {branch.linkedinUrl && (
                          <div className="flex items-center">
                            <Linkedin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-xs">LinkedIn</span>
                          </div>
                        )}
                        {branch.instagramUrl && (
                          <div className="flex items-center">
                            <Instagram className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-xs">Instagram</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {branch.type || 'Non specificato'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setLocation(`/branches/${branch.id}`)}
                        >
                          <Building className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(branch)}
                        >
                          <PenTool className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Eliminerai permanentemente la filiale <strong>{branch.name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(branch.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}