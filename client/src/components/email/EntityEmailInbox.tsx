import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mail, PlusCircle, FileText, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmails } from "@/hooks/useEmails";
import { useAccounts } from "@/hooks/useAccounts";
import EmailInbox from "./EmailInbox";
import NewEmailComposer from "./NewEmailComposer";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DealModal from "@/components/modals/DealModal";
import TaskModal from "@/components/modals/TaskModal";
import { T } from "@/lib/translationHelper";

// Tipo per i tipi di entità supportate
type EntityType = "contact" | "lead" | "company" | "branch" | "deal";

// Interfaccia per le email
interface Email {
  id: number;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
  accountId: number;
  accountInfo?: {
    id: number;
    name: string;
  };
}

interface EntityEmailInboxProps {
  entityId: number;
  entityType: EntityType;
  entityName?: string; // Nome dell'entità per il filtro visivo
  entityEmail?: string; // Email dell'entità (se presente)
  companyDomain?: string; // Dominio dell'azienda (per l'evidenziazione delle email aziendali)
}

export default function EntityEmailInbox({
  entityId,
  entityType,
  entityName,
  entityEmail,
  companyDomain
}: EntityEmailInboxProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stati locali
  const [composingEmail, setComposingEmail] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedTaskEmail, setSelectedTaskEmail] = useState<Email | null>(null);
  const [selectedDealEmail, setSelectedDealEmail] = useState<Email | null>(null);
  const [currentCompanyForDeal, setCurrentCompanyForDeal] = useState<{id: number; name: string} | null>(null);
  const [selectedEmailForAction, setSelectedEmailForAction] = useState<Email | null>(null);
  
  // Recupera gli account email configurati
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  
  // Seleziona l'account primario o l'ultimo utilizzato
  const primaryAccount = accounts && accounts.length > 0 ? accounts[0] : null;
  
  // Carica le email filtrate per questa entità specifica
  const { data: emails, isLoading: isLoadingEmails } = useQuery({
    queryKey: [`/api/email/filter/${entityType}/${entityId}`],
    queryFn: async () => {
      try {
        // In produzione, questo endpoint dovrebbe filtrare le email nel backend
        // In questo MVP, implementiamo il filtro lato client per velocizzare lo sviluppo
        
        // 1. Recuperiamo tutte le email da tutti gli account
        const allEmails: any[] = [];
        
        if (accounts && accounts.length > 0) {
          for (const account of accounts) {
            const response = await fetch(`/api/email/accounts/${account.id}/messages?folder=INBOX`);
            if (response.ok) {
              const messages = await response.json();
              if (Array.isArray(messages)) {
                // Aggiungiamo informazioni sull'account a ciascuna email
                messages.forEach(message => {
                  allEmails.push({
                    ...message,
                    accountInfo: {
                      id: account.id,
                      name: account.name || account.email.split('@')[1] || 'Email',
                    }
                  });
                });
              }
            }
          }
        }
        
        // 2. Filtriamo le email in base all'entità (entityId e entityType)
        // In un'implementazione reale, questo dovrebbe essere fatto lato server
        return allEmails.filter(email => {
          // Controlliamo se l'email è correlata all'entità
          const isRelated = 
            // Contatto o lead - controlliamo email e campi to/cc/bcc
            (entityType === 'contact' || entityType === 'lead') && (
              (entityEmail && (
                email.from?.includes(entityEmail) || 
                email.to?.some(to => to.includes(entityEmail)) ||
                email.cc?.some(cc => cc.includes(entityEmail)) ||
                email.bcc?.some(bcc => bcc.includes(entityEmail))
              ))
            ) ||
            // Azienda - controlliamo il dominio dell'email
            (entityType === 'company' && companyDomain && (
              email.from?.includes(`@${companyDomain}`) ||
              email.to?.some(to => to.includes(`@${companyDomain}`)) ||
              email.cc?.some(cc => cc.includes(`@${companyDomain}`)) ||
              email.bcc?.some(bcc => bcc.includes(`@${companyDomain}`))
            )) ||
            // Branch - simile all'azienda ma più specifico
            (entityType === 'branch' && companyDomain && (
              email.from?.includes(`@${companyDomain}`) ||
              email.to?.some(to => to.includes(`@${companyDomain}`)) ||
              email.cc?.some(cc => cc.includes(`@${companyDomain}`)) ||
              email.bcc?.some(bcc => bcc.includes(`@${companyDomain}`))
            )) ||
            // Deal - verifichiamo la presenza del numero di deal nell'oggetto o corpo
            (entityType === 'deal' && (
              email.subject?.includes(`DEAL-${entityId}`) ||
              email.body?.includes(`DEAL-${entityId}`)
            ));
          
          return isRelated;
        });
      } catch (error) {
        console.error("Errore durante il recupero delle email filtrate:", error);
        return [];
      }
    },
    enabled: !!accounts && accounts.length > 0 && !!entityId,
  });
  
  // Funzione per aprire il compositore di email
  const handleComposeEmail = () => {
    setComposingEmail(true);
  };
  
  // Funzione per gestire la creazione di un task da un'email
  const handleCreateTask = (email: Email) => {
    setSelectedTaskEmail(email);
    setShowTaskModal(true);
  };
  
  // Funzione per gestire la creazione di un deal da un'email
  const handleCreateDeal = (email: Email) => {
    setSelectedDealEmail(email);
    
    // Se l'entità è un contatto, verifichiamo se ha un'azienda associata
    if (entityType === 'contact' || entityType === 'lead') {
      // Qui dovremmo recuperare le relazioni aziendali del contatto
      // In una versione reale, questo verrebbe fatto con una query specifica
      
      // Per ora, gestiamo il caso semplificato:
      // Se il contatto ha un'unica azienda associata, la usiamo
      // Altrimenti apriamo il modal per la scelta dell'azienda
      
      // Questo chiamerebbe un hook come useContactCompanies(entityId)
      // Per ora simuliamo che abbiamo bisogno di selezionare manualmente
      setCurrentCompanyForDeal(null); // null significa che dovremo selezionarla nel modal
    }
    
    setShowDealModal(true);
  };
  
  // Stile condizionale per email con dominio aziendale
  const getEmailStyle = (email: Email): string => {
    if (companyDomain) {
      const isDomainEmail = 
        email.from?.includes(`@${companyDomain}`) ||
        email.to?.some((to: string) => to.includes(`@${companyDomain}`));
      
      if (isDomainEmail) {
        return "border-l-4 border-primary"; // Evidenzia le email aziendali
      }
    }
    return "";
  };
  
  // Renderizza l'interfaccia del compositore email quando attivo
  if (composingEmail) {
    return (
      <NewEmailComposer
        accountId={primaryAccount?.id}
        onCancel={() => setComposingEmail(false)}
        onSent={() => {
          setComposingEmail(false);
          // Invalida la query per ricaricare le email
          queryClient.invalidateQueries({
            queryKey: [`/api/email/filter/${entityType}/${entityId}`],
          });
          toast({
            title: T(t, "email.sentSuccess", "Email inviata"),
            description: T(t, "email.sentSuccessDescription", "La tua email è stata inviata con successo"),
          });
        }}
      />
    );
  }
  
  // Funzione per renderizzare le azioni aggiuntive per email
  const renderEmailActions = (email: Email) => {
    // Mostra azioni aggiuntive solo per contatti e lead
    if (entityType === 'contact' || entityType === 'lead') {
      return (
        <div className="mt-2 flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCreateTask(email)}
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            {T(t, "email.createTask", "Crea attività")}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCreateDeal(email)}
            className="text-xs"
          >
            <Briefcase className="h-3 w-3 mr-1" />
            {T(t, "email.createDeal", "Crea opportunità")}
          </Button>
        </div>
      );
    }
    return null;
  };
  
  // Funzione per renderizzare i badge degli account email
  const renderAccountBadge = (email: Email) => {
    if (email.accountInfo) {
      return (
        <Badge variant="outline" className="ml-2">
          {email.accountInfo.name}
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{T(t, "email.relatedEmails", "Email correlate")}</h2>
        <Button onClick={handleComposeEmail}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {T(t, "email.compose", "Scrivi Email")}
        </Button>
      </div>
      
      {isLoadingAccounts || isLoadingEmails ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : !emails || emails.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <Mail className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{T(t, "email.noRelatedEmails", "Nessuna email correlata")}</h3>
          <p className="text-muted-foreground mb-4">
            {T(t, "email.noRelatedEmailsDescription", "Non ci sono email correlate a questa entità")}
          </p>
          <Button onClick={handleComposeEmail}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {T(t, "email.compose", "Scrivi Email")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 border rounded-md hover:bg-muted/50 cursor-pointer ${getEmailStyle(email)}`}
              onClick={() => setSelectedEmailForAction(email)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center">
                    {email.fromName || email.from.split("@")[0]}
                    {renderAccountBadge(email)}
                  </div>
                  <div className="text-sm">{email.subject}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(email.date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {email.body?.replace(/<[^>]*>/g, "").substring(0, 120) || ""}
              </div>
              {renderEmailActions(email)}
            </div>
          ))}
        </div>
      )}
      
      {/* Task Modal */}
      {showTaskModal && selectedTaskEmail && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          entityId={entityId}
          entityType={entityType}
          initialData={{
            title: `Task relativo a: ${selectedTaskEmail.subject}`,
            notes: `Email da: ${selectedTaskEmail.from}\nData: ${new Date(selectedTaskEmail.date).toLocaleString()}\n\n${selectedTaskEmail.body?.replace(/<[^>]*>/g, "") || ""}`
          }}
        />
      )}
      
      {/* Deal Modal */}
      {showDealModal && selectedDealEmail && (
        <DealModal
          isOpen={showDealModal}
          onClose={() => setShowDealModal(false)}
          initialData={{
            name: `Nuova opportunità: ${selectedDealEmail.subject}`,
            description: `Generato da email: ${selectedDealEmail.subject}\nInviata da: ${selectedDealEmail.from}`,
            contactId: entityType === 'contact' ? entityId : undefined,
            companyId: currentCompanyForDeal?.id,
          }}
        />
      )}
    </>
  );
}