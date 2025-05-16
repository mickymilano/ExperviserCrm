import { useState } from "react";
import { useBranches } from "@/hooks/useBranches";
import { Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import BranchModal from "@/components/modals/BranchModal";
import { Skeleton } from "@/components/ui/skeleton";
import BranchList from "@/components/branches/BranchList";

export default function Branches() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { branches, isLoading } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  // Debug: Aggiungiamo console.log per verificare i dati ricevuti
  console.log("Branches Page - branches:", branches);

  // Filter branches based on search term
  const filteredBranches = branches?.filter((branch) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      branch.name.toLowerCase().includes(searchTermLower) ||
      (branch.type && branch.type.toLowerCase().includes(searchTermLower)) ||
      (branch.companyName && branch.companyName.toLowerCase().includes(searchTermLower)) ||
      (branch.email && branch.email.toLowerCase().includes(searchTermLower)) ||
      (branch.address && branch.address.toLowerCase().includes(searchTermLower))
    );
  });

  // Handle edit branch
  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Filiali</h1>
        <Button onClick={() => {
          setSelectedBranch(null);
          setShowModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi Filiale
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca filiali..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="mr-2 h-4 w-4" /> Filtra
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredBranches && filteredBranches.length > 0 ? (
        <BranchList 
          branches={filteredBranches} 
          onEdit={handleEdit} 
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessuna filiale trovata</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Prova a modificare i termini di ricerca."
                : "Inizia aggiungendo la tua prima filiale."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Filiale
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <BranchModal
        open={showModal}
        onOpenChange={setShowModal}
        initialData={selectedBranch}
      />
    </div>
  );
}