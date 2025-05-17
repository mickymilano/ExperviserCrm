import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Contact } from "@shared/schema";
import { Plus, Trash, LinkIcon, UserPlus } from "lucide-react";
import ContactModal from "../modals/ContactModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateAvatarColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";

interface CompanyContactsTabProps {
  companyId: number;
  companyName: string;
}

export default function CompanyContactsTab({ companyId, companyName }: CompanyContactsTabProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch contacts associated with this company
  const { data: contacts, isLoading, isError } = useQuery({
    queryKey: [`/api/companies/${companyId}/contacts`],
    enabled: !!companyId,
  });

  // Handle adding a new contact
  const handleAddContact = () => {
    setSelectedContact(null);
    setIsContactModalOpen(true);
  };

  // Handle editing an existing contact
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  // Handle removing a contact from this company (not deleting the contact)
  const handleRemoveFromCompany = async (contactId: number) => {
    if (!confirm("Sei sicuro di voler rimuovere questo contatto dall'azienda?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}/company`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: null }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore durante la rimozione del contatto dall\'azienda');
      }

      toast({
        title: "Successo",
        description: "Contatto rimosso dall'azienda",
      });

      // Refresh contacts list
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contacts`] });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    }
  };

  // Navigate to contact detail page
  const navigateToContact = (contactId: number) => {
    navigate(`/contacts/${contactId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium mb-4">
            Si è verificato un errore durante il caricamento dei contatti
          </p>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contacts`] })}
          >
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Contatti di {companyName}</h3>
            <Button onClick={handleAddContact}>
              <UserPlus className="h-4 w-4 mr-2" />
              Aggiungi Contatto
            </Button>
          </div>

          {contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: Contact) => {
                  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();
                  const bgColor = generateAvatarColor(`${contact.firstName} ${contact.lastName}`);
                  
                  return (
                    <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium" onClick={() => navigateToContact(contact.id)}>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: bgColor }}>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          {contact.firstName} {contact.lastName}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigateToContact(contact.id)}>
                        {contact.companyEmail || contact.privateEmail || "-"}
                      </TableCell>
                      <TableCell onClick={() => navigateToContact(contact.id)}>
                        {contact.mobilePhone || contact.officePhone || contact.privatePhone || "-"}
                      </TableCell>
                      <TableCell onClick={() => navigateToContact(contact.id)}>
                        {contact.role || "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditContact(contact)} title="Modifica">
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCompany(contact.id);
                          }}
                          title="Rimuovi dall'azienda"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 border rounded-md bg-muted/20">
              <p className="text-muted-foreground mb-4">Nessun contatto associato a questa azienda</p>
              <Button onClick={handleAddContact} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi il primo contatto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Modal for adding/editing contacts */}
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        initialData={{
          ...(selectedContact || {}),
          companyId: companyId,
        }}
      />
    </>
  );
}