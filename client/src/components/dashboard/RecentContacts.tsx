import { Contact } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Eye, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useLocation } from "wouter";

interface RecentContactsProps {
  contacts?: Contact[];
}

export default function RecentContacts({ contacts }: RecentContactsProps) {
  const [_, navigate] = useLocation();
  
  if (!contacts) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const getAvatarColor = (id: number) => {
    const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-warning", "bg-destructive"];
    return colors[id % colors.length];
  };
  
  // Gestisce la navigazione alla pagina di dettaglio del contatto
  const handleViewContact = (id: number) => {
    navigate(`/contacts/${id}`);
  };
  
  // Gestisce l'invio di email
  const handleSendEmail = (email: string | undefined) => {
    // Se abbiamo una vera funzionalità di email in futuro, la usiamo qui
    // Per ora, apriamo il client email predefinito
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Contatti Recenti</CardTitle>
          <Button 
            variant="link" 
            className="text-primary hover:text-primary-dark text-sm font-medium"
            onClick={() => navigate('/contacts')}
          >
            Vedi tutti i contatti
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Nome</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Azienda</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Ultimo Contatto</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-light">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className={`h-8 w-8 ${getAvatarColor(contact.id)}`}>
                        <AvatarFallback>
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-dark">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-xs text-neutral-medium">{contact.jobTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-dark">
                    {/* Recupererebbe il nome dell'azienda dal database */}
                    Nome Azienda
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-medium">
                    {contact.email}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-medium">
                    {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:text-primary-dark h-8 w-8" 
                        title="Email"
                        onClick={() => contact.email && handleSendEmail(contact.email)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:text-primary-dark h-8 w-8" 
                        title="Visualizza"
                        onClick={() => handleViewContact(contact.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
