import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { Contact, Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Eye, Mail, Trash, Edit } from "lucide-react";
import ContactModal from "@/components/modals/ContactModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateAvatarColor, getInitials, formatPhoneNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Contacts() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, isLoading, deleteContact } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [location, navigate] = useLocation();
  
  // Estrai parametri dalla querystring per gestire la creazione di un contatto da pagina azienda
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const companyIdFromUrl = searchParams.get('companyId');
  const companyNameFromUrl = searchParams.get('companyName');
  
  // Se il parametro di creazione da azienda è presente, apri il modal
  useEffect(() => {
    if (companyIdFromUrl && companyNameFromUrl) {
      setSelectedContact({
        firstName: '',
        lastName: '',
        companyEmail: '',
        areasOfActivity: [{
          companyId: parseInt(companyIdFromUrl),
          companyName: decodeURIComponent(companyNameFromUrl),
          isPrimary: true,
          role: '',
          jobDescription: `Works at ${decodeURIComponent(companyNameFromUrl)}`
        }]
      } as any);
      setShowModal(true);
    }
  }, [companyIdFromUrl, companyNameFromUrl]);
  
  // Debug: Aggiungiamo console.log per verificare i dati ricevuti
  console.log("Contacts Page - contacts:", contacts);
  console.log("Contacts Page - companies:", companies);

  // Get company name for a contact from their areas of activity
  const getCompanyName = (contact: Contact): string => {
    if (!contact.areasOfActivity || contact.areasOfActivity.length === 0) {
      // Fallback to legacy companyId if it exists
      if (contact.companyId) {
        const company = companies?.find((c) => c.id === contact.companyId);
        return company ? company.name : "-";
      }
      return "-";
    }
    
    // First try to find the primary area
    const primaryArea = contact.areasOfActivity.find(area => area.isPrimary);
    
    if (primaryArea) {
      // If we have a primary area with a company name directly in the area, use that
      if (primaryArea.companyName) {
        return primaryArea.companyName;
      }
      
      // Otherwise try to find the company by ID
      if (primaryArea.companyId && companies) {
        const company = companies.find(c => c.id === primaryArea.companyId);
        if (company) {
          return company.name;
        }
      }
    }
    
    // If no primary area is found, use the first area
    const firstArea = contact.areasOfActivity[0];
    
    if (firstArea.companyName) {
      return firstArea.companyName;
    }
    
    if (firstArea.companyId && companies) {
      const company = companies.find(c => c.id === firstArea.companyId);
      if (company) {
        return company.name;
      }
    }
    
    return "-";
  };

  // Filter contacts based on search term
  const filteredContacts = contacts?.filter((contact) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (contact.firstName?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.lastName?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.companyEmail?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.privateEmail?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.mobilePhone?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.officePhone?.toLowerCase() || "").includes(searchTermLower) ||
      (contact.privatePhone?.toLowerCase() || "").includes(searchTermLower)
    );
  });

  // Handle edit contact
  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  // Handle delete contact
  const handleDelete = async (id: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questo contatto?")) {
      deleteContact.mutate(id);
    }
  };
  
  // Handle view contact details
  const handleViewContact = (id: number) => {
    navigate(`/contacts/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Contatti</h1>
        <Button onClick={() => {
          setSelectedContact(null);
          setShowModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi Contatto
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca contatti..."
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

      {isLoading || isLoadingCompanies ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredContacts && filteredContacts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Nome</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Telefono</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Azienda</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Tag</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar className={`h-8 w-8 ${generateAvatarColor(String(contact.id))}`}>
                        <AvatarFallback>
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-sm text-muted-foreground">{contact.jobTitle || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{contact.companyEmail || contact.privateEmail || "-"}</td>
                  <td className="py-3 px-4 text-sm">{formatPhoneNumber(contact.mobilePhone || contact.officePhone || contact.privatePhone) || "-"}</td>
                  <td className="py-3 px-4 text-sm">
                    {(() => {
                      // First identify if there's a company to link to
                      let companyId: number | undefined;
                      
                      if (contact.areasOfActivity && contact.areasOfActivity.length > 0) {
                        // Try to get the primary company first
                        const primaryArea = contact.areasOfActivity.find(area => area.isPrimary);
                        if (primaryArea && primaryArea.companyId) {
                          companyId = primaryArea.companyId;
                        } else if (contact.areasOfActivity[0].companyId) {
                          // Fallback to first company
                          companyId = contact.areasOfActivity[0].companyId;
                        }
                      } else if (contact.companyId) {
                        // Legacy fallback
                        companyId = contact.companyId;
                      }
                      
                      const companyName = getCompanyName(contact);
                      
                      if (companyId && companyName !== "-") {
                        return (
                          <span 
                            className="text-primary hover:underline cursor-pointer" 
                            onClick={() => navigate(`/companies/${companyId}`)}
                          >
                            {companyName}
                          </span>
                        );
                      }
                      
                      return companyName;
                    })()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && contact.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          const email = contact.companyEmail || contact.privateEmail;
                          if (email) window.location.href = `mailto:${email}`;
                        }}
                        disabled={!contact.companyEmail && !contact.privateEmail}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewContact(contact.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            Modifica Contatto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(contact.id)}
                          >
                            Elimina Contatto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessun contatto trovato</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Prova a modificare i termini di ricerca."
                : "Inizia aggiungendo il tuo primo contatto."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Contatto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ContactModal
        open={showModal}
        onOpenChange={setShowModal}
        initialData={selectedContact}
      />
    </div>
  );
}
