import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useBranch } from "@/hooks/useBranches";
import { useCompanies } from "@/hooks/useCompanies";
import { Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import BranchModal from "@/components/modals/BranchModal";
import { 
  ArrowLeft, Edit, Globe, Phone, Mail, MapPin, Building, Calendar, Info,
  Flag, Hash
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BranchDetail() {
  const [_, params] = useRoute<{ id: string }>("/branches/:id");
  const [showEditModal, setShowEditModal] = useState(false);
  const [__, navigate] = useLocation();
  const branchId = parseInt(params?.id || "0");
  
  const { data: branch, isLoading, error } = useBranch(branchId);
  const { companies } = useCompanies();
  
  // Debug console output
  console.log("Branch detail page - branch:", branch);
  
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/branches")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40 mb-2" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/branches")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
          </Button>
          <h1 className="text-2xl font-bold">Filiale non trovata</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              La filiale richiesta non esiste o è stata eliminata
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Controlla l'URL o torna alla lista delle filiali
            </p>
            <Button onClick={() => navigate("/branches")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna alle Filiali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find company name if not already in the branch data
  const companyName = branch.companyName || companies?.find(c => c.id === branch.companyId)?.name || "Azienda non specificata";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/branches")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
          </Button>
          <h1 className="text-2xl font-bold">{branch.name}</h1>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          <Edit className="mr-2 h-4 w-4" /> Modifica Filiale
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Informazioni Filiale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Dettagli Principali</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="mr-2 font-medium">Azienda:</span>
                    <span>{companyName}</span>
                  </div>
                  {branch.type && (
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="mr-2 font-medium">Tipo:</span>
                      <span>{branch.type}</span>
                    </div>
                  )}
                  {branch.isHeadquarters && (
                    <div className="flex items-center text-primary">
                      <Info className="h-4 w-4 mr-2" />
                      <span className="font-medium">Sede Principale</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contatti</h3>
                <div className="space-y-2">
                  {branch.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="mr-2 font-medium">Email:</span>
                      <a 
                        href={`mailto:${branch.email}`}
                        className="text-primary hover:underline"
                      >
                        {branch.email}
                      </a>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="mr-2 font-medium">Telefono:</span>
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Social</h3>
                <div className="space-y-2">
                  {branch.linkedinUrl && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="mr-2 font-medium">LinkedIn:</span>
                      <a 
                        href={branch.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[200px]"
                      >
                        {branch.linkedinUrl}
                      </a>
                    </div>
                  )}
                  {branch.instagramUrl && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="mr-2 font-medium">Instagram:</span>
                      <a 
                        href={branch.instagramUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[200px]"
                      >
                        {branch.instagramUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Indirizzo</h3>
                <div className="space-y-2">
                  {branch.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p>{branch.address}</p>
                        {branch.city && (
                          <p>
                            {branch.city}
                            {branch.postalCode && `, ${branch.postalCode}`}
                          </p>
                        )}
                        {branch.region && <p>{branch.region}</p>}
                        {branch.country && <p>{branch.country}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {branch.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Descrizione</h3>
                  <p className="whitespace-pre-line">{branch.description}</p>
                </div>
              )}

              {branch.customFields && Object.keys(branch.customFields).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Campi Personalizzati</h3>
                  <div className="space-y-2">
                    {Object.entries(branch.customFields).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="mr-2 font-medium">{key}:</span>
                        <span>{value?.toString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Date</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="mr-2 font-medium">Creata il:</span>
                    <span>{formatDate(branch.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="mr-2 font-medium">Ultima modifica:</span>
                    <span>{formatDate(branch.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BranchModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        initialData={branch}
      />
    </div>
  );
}