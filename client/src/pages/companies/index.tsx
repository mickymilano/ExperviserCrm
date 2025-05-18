import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useCompanies } from "@/hooks/useCompanies";
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Filter, Eye, Trash, Edit, Globe, Phone, Mail, MapPin,
  Calendar, Hash, Building, Flag, Users
} from "lucide-react";
import CompanyModal from "@/components/modals/CompanyModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils";

export default function Companies() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { companies, isLoading, deleteCompany } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [_, navigate] = useLocation();
  
  // Debug: Aggiungiamo console.log per verificare i dati ricevuti
  console.log("Companies Page - companies:", companies);

  // Filter companies based on search term
  const filteredCompanies = companies?.filter((company) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(searchTermLower) ||
      (company.industry && company.industry.toLowerCase().includes(searchTermLower)) ||
      (company.email && company.email.toLowerCase().includes(searchTermLower))
    );
  });

  // Handle edit company
  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  // Handle delete company
  const handleDelete = async (id: number) => {
    if (window.confirm(t("companyList.deleteConfirmation"))) {
      deleteCompany.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Aziende</h1>
        <Button onClick={() => {
          setSelectedCompany(null);
          setShowModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi Azienda
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca aziende..."
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
      ) : filteredCompanies && filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{company.name}</h3>
                    <div className="flex items-center">
                      {company.industry && (
                        <Badge variant="outline" className="mr-2">
                          {company.industry}
                        </Badge>
                      )}
                      {company.customFields?.size && (
                        <Badge variant="secondary" className="text-xs">
                          {company.customFields.size}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(company)}>
                        Modifica Azienda
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(company.id)}
                      >
                        Elimina Azienda
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="space-y-2">
                      {company.website && (
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate max-w-[200px]"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={`mailto:${company.email}`}
                            className="hover:underline truncate max-w-[200px]"
                          >
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{formatPhoneNumber(company.phone)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {company.customFields?.country && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          {company.customFields.city 
                            ? <span>{company.customFields.city}, {company.customFields.country}</span>
                            : <span>{company.customFields.country}</span>
                          }
                        </div>
                      )}
                      
                      {(company.fullAddress || company.address) && !company.customFields?.country && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{company.fullAddress || company.address}</span>
                        </div>
                      )}
                      
                      {company.customFields?.vatNumber && (
                        <div className="flex items-center text-sm">
                          <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">VAT: {company.customFields.vatNumber}</span>
                        </div>
                      )}
                      
                      {company.customFields?.yearFounded && (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Founded: {company.customFields.yearFounded}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {company.tags && company.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {company.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/companies/${company.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Vedi Dettagli
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => company.email ? window.location.href = `mailto:${company.email}` : null}
                    disabled={!company.email}
                  >
                    <Mail className="h-4 w-4 mr-1" /> Contatta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessuna azienda trovata</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Prova a modificare i termini di ricerca."
                : "Inizia aggiungendo la tua prima azienda."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Azienda
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CompanyModal
        open={showModal}
        onOpenChange={setShowModal}
        initialData={selectedCompany}
      />
    </div>
  );
}
