import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import AsyncSelect from "react-select/async";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Phone, Plus, X, UserPlus, Star, StarOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/utils";
import ContactModal from "@/components/modals/ContactModal";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyEmail?: string;
  privateEmail?: string;
  mobilePhone?: string;
  officePhone?: string;
  role?: string;
}

interface CompanyContactsTabProps {
  companyId: number;
  companyName: string;
}

export default function CompanyContactsTab({ companyId, companyName }: CompanyContactsTabProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [primaryContactId, setPrimaryContactId] = useState<number | null>(null);
  const [isUpdatingPrimary, setIsUpdatingPrimary] = useState(false);
  // State per il modal contatto
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalInitialData, setContactModalInitialData] = useState<any>(null);
  
  // Fetch di TUTTI i contatti e aree di attività
  const { 
    data: allContacts, 
    isLoading: isLoadingAllContacts 
  } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?includeAreas=true`);
      if (!res.ok) throw new Error(t("company.contacts.errors.fetchContacts"));
      const data = await res.json();
      console.log(`Retrieved ${data.length} total contacts with their areas`);
      return data;
    }
  });

  // Filtriamo i contatti basandoci sui dati delle aree di attività 
  // contenute dentro ciascun contatto
  const contacts = useMemo(() => {
    if (!allContacts) return [];
    
    // Filtriamo i contatti che hanno aree di attività associate a questa azienda
    const companyContacts = allContacts.filter(contact => {
      if (!contact.areasOfActivity) return false;
      
      // Controlla se almeno un'area è associata a questa azienda
      return contact.areasOfActivity.some(
        area => area.companyId === companyId
      );
    });
    
    console.log(`Filtered ${companyContacts.length} contacts for company ${companyId}`);
    return companyContacts;
  }, [allContacts, companyId]);
  
  // Stato derivato per facilità d'uso nel componente
  const isLoadingContacts = isLoadingAllContacts;
  const contactsError = null; // Non abbiamo più lo stato di errore separato
  const refetchContacts = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  };
  
  // Fetch dati dell'azienda per ottenere il contatto primario
  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error(t("company.contacts.errors.fetchCompanyDetails"));
      const data = await res.json();
      
      // Aggiorna lo stato del contatto primario
      if (data.primary_contact_id) {
        setPrimaryContactId(data.primary_contact_id);
      } else {
        setPrimaryContactId(null);
      }
      
      return data;
    }
  });

  // Funzione per caricare i contatti filtrati (usata da AsyncSelect)
  const loadContactOptions = async (inputValue: string) => {
    try {
      const url = `/api/contacts?unassigned=true${inputValue ? `&search=${encodeURIComponent(inputValue)}` : ''}`;
      console.log(`Fetching contacts with URL: ${url}`);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("company.contacts.errors.fetchUnassignedContacts"));
      
      const contacts = await res.json();
      
      return contacts.map((contact: Contact) => ({
        value: contact.id.toString(),
        label: `${contact.firstName} ${contact.lastName}`
      }));
    } catch (error) {
      console.error("Error loading contact options:", error);
      return [];
    }
  };

  // Associa un contatto all'azienda
  const associateContact = async () => {
    if (!selectedContactId) return;
    
    try {
      setIsContactLoading(true);
      
      // Creiamo una nuova area di attività
      const res = await fetch(`/api/contacts/${selectedContactId}/areas-of-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          role: "", // L'utente può aggiornare il ruolo in seguito
          isPrimary: false
        }),
      });

      if (!res.ok) {
        throw new Error(t("company.contacts.errors.associationError"));
      }

      // Aggiorniamo anche il campo companyId del contatto
      const updateRes = await fetch(`/api/contacts/${selectedContactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId
        }),
      });

      if (!updateRes.ok) {
        console.warn("Aggiornamento campo companyId fallito, ma l'area di attività è stata creata");
      }

      // Chiudi il modal e aggiorna i dati
      setModalOpen(false);
      setSelectedContactId(null);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "contacts"] });
      
      toast({
        title: t("company.contacts.notifications.associatedSuccess"),
        description: t("company.contacts.notifications.associatedDescription", { companyName }),
      });
      
      // Refresh contacts list
      refetchContacts();
      
    } catch (error) {
      console.error("Errore nell'associazione:", error);
      toast({
        title: t("company.contacts.error"),
        description: t("company.contacts.notifications.associationError"),
        variant: "destructive",
      });
    } finally {
      setIsContactLoading(false);
    }
  };

  // Disassocia un contatto dall'azienda
  // Imposta un contatto come primario per l'azienda
  const setPrimaryContact = async (contactId: number) => {
    try {
      setIsUpdatingPrimary(true);
      
      console.log(`Impostazione contatto primario ${contactId} per azienda ${companyId}`);
      
      const res = await fetch(`/api/companies/${companyId}/primary-contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryContactId: contactId.toString() // Assicura che sia una stringa
        }),
      });
      
      if (!res.ok) {
        throw new Error(t("company.contacts.errors.setPrimaryContact"));
      }
      
      const updatedCompany = await res.json();
      console.log("Risposta dal server dopo l'impostazione del contatto primario:", updatedCompany);
      
      // Aggiorna lo stato locale
      setPrimaryContactId(contactId);
      
      // Invalidazione esplicita di tutte le queries correlate all'azienda
      // Invalida la query dell'azienda per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "contacts"] });
      
      toast({
        title: t("company.contacts.notifications.primaryContactSet"),
        description: t("company.contacts.notifications.primaryContactSetDescription"),
      });
      
    } catch (error) {
      console.error("Errore nell'impostazione del contatto primario:", error);
      toast({
        title: t("company.contacts.error"),
        description: t("company.contacts.notifications.primaryContactSetError"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrimary(false);
    }
  };

  // Rimuove il contatto primario dell'azienda
  const removePrimaryContact = async () => {
    try {
      setIsUpdatingPrimary(true);
      
      const res = await fetch(`/api/companies/${companyId}/primary-contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryContactId: null
        }),
      });
      
      if (!res.ok) {
        throw new Error(t("company.contacts.errors.removePrimaryContact"));
      }
      
      // Aggiorna lo stato locale
      setPrimaryContactId(null);
      
      // Invalida la query dell'azienda per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      
      toast({
        title: t("company.contacts.notifications.primaryContactRemoved"),
        description: t("company.contacts.notifications.primaryContactRemovedDescription"),
      });
      
    } catch (error) {
      console.error("Errore nella rimozione del contatto primario:", error);
      toast({
        title: t("company.contacts.error"),
        description: t("company.contacts.notifications.primaryContactRemoveError"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrimary(false);
    }
  };
  
  const disassociateContact = async (contactId: number, contactName: string) => {
    // Chiediamo conferma all'utente prima di procedere
    if (!window.confirm(t("company.contacts.confirmRemoval", { contactName, companyName }))) {
      return; // L'utente ha annullato l'operazione
    }
    
    try {
      // Se stiamo disassociando il contatto primario, dobbiamo prima rimuoverlo come primario
      if (contactId === primaryContactId) {
        await removePrimaryContact();
      }
      
      // Otteniamo prima le aree di attività del contatto
      const areasRes = await fetch(`/api/contacts/${contactId}/areas-of-activity`);
      if (!areasRes.ok) throw new Error(t("company.contacts.errors.fetchAreasOfActivity"));
      
      const areas = await areasRes.json();
      
      // Troviamo l'area di attività associata a questa azienda
      const area = areas.find((a: any) => a.companyId === companyId);
      
      if (!area) {
        throw new Error(t("company.contacts.errors.areaNotFound"));
      }
      
      // Eliminiamo l'area di attività
      const deleteRes = await fetch(`/api/areas-of-activity/${area.id}`, {
        method: "DELETE",
      });
      
      if (!deleteRes.ok) {
        throw new Error(t("company.contacts.errors.deleteArea"));
      }
      
      // Aggiorniamo anche il campo companyId del contatto (se è questa l'azienda primaria)
      if (area.isPrimary) {
        const updateRes = await fetch(`/api/contacts/${contactId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: null
          }),
        });
        
        if (!updateRes.ok) {
          console.warn("Aggiornamento campo companyId fallito, ma l'area di attività è stata eliminata");
        }
      }
      
      // Aggiorniamo i dati
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "contacts"] });
      
      toast({
        title: t("company.contacts.notifications.contactDisassociated"),
        description: t("company.contacts.notifications.contactDisassociatedDescription", { companyName }),
      });
      
      // Refresh contacts list
      refetchContacts();
      
    } catch (error) {
      console.error("Errore nella disassociazione:", error);
      toast({
        title: "Errore",
        description: "Impossibile disassociare il contatto dall'azienda",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {t('company.contacts.title')} ({contacts?.length || 0})
            </CardTitle>
            <CardDescription>
              {t('company.contacts.description', { companyName })}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setModalOpen(true)} 
              size="sm"
              className="flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('company.contacts.associateExisting')}
            </Button>
            <Button 
              onClick={() => {
                // Apriamo direttamente il modale interno invece di navigare
                setContactModalOpen(true);
                setContactModalInitialData({
                  firstName: '',
                  lastName: '',
                  companyEmail: '',
                  areasOfActivity: [{
                    companyId: companyId,
                    companyName: company?.name || companyName,
                    isPrimary: true,
                    role: '',
                    jobDescription: t('company.contacts.worksAt', { companyName: company?.name || companyName })
                  }]
                });
              }}
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('company.contacts.createNew')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingContacts ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contactsError ? (
            <div className="text-center py-8">
              <X className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">Errore</h3>
              <p className="text-muted-foreground mb-4">
                Impossibile caricare i contatti di questa azienda.
              </p>
              <Button onClick={() => refetchContacts()}>
                Riprova
              </Button>
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-6">
              {contacts.map((contact: Contact) => (
                <div key={contact.id} className={`flex items-start space-x-4 p-3 rounded-lg ${primaryContactId === contact.id ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                  <Avatar className={`h-10 w-10 ${primaryContactId === contact.id ? 'ring-2 ring-yellow-500' : ''}`}>
                    <AvatarFallback>
                      {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                          {primaryContactId === contact.id && (
                            <span 
                              className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              title={t('company.contacts.primaryContactTooltip')}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {t('company.contacts.primaryContact')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contact.role || t('company.contacts.noRoleSpecified')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {primaryContactId !== contact.id ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-white hover:bg-yellow-50 text-yellow-600 border-yellow-300 hover:border-yellow-400"
                            disabled={isUpdatingPrimary}
                            onClick={() => setPrimaryContact(contact.id)}
                            title={t('company.contacts.setPrimaryContactTooltip')}
                            aria-label={t('company.contacts.setPrimaryContactAriaLabel')}
                          >
                            {isUpdatingPrimary ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('company.contacts.setting')}
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                {t('company.contacts.setAsPrimary')}
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-yellow-50 hover:bg-white text-yellow-700 border-yellow-300"
                            disabled={isUpdatingPrimary}
                            onClick={() => removePrimaryContact()}
                            title={t('company.contacts.removePrimaryContactTooltip')}
                            aria-label={t('company.contacts.removePrimaryContactAriaLabel')}
                          >
                            {isUpdatingPrimary ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('company.contacts.removing')}
                              </>
                            ) : (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                {t('company.contacts.removePrimary')}
                              </>
                            )}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          title="Visualizza la scheda completa del contatto"
                          aria-label="Visualizza profilo contatto"
                        >
                          Visualizza Profilo
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => disassociateContact(contact.id, `${contact.firstName} ${contact.lastName}`)}
                          title="Rimuovi questo contatto dall'azienda corrente"
                          aria-label="Disassocia contatto"
                        >
                          Disassocia
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {contact.companyEmail && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a href={`mailto:${contact.companyEmail}`} className="text-sm hover:underline">
                            {contact.companyEmail}
                          </a>
                        </div>
                      )}
                      
                      {contact.privateEmail && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a href={`mailto:${contact.privateEmail}`} className="text-sm hover:underline">
                            {contact.privateEmail}
                          </a>
                        </div>
                      )}
                      
                      {contact.mobilePhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{formatPhoneNumber(contact.mobilePhone)}</span>
                        </div>
                      )}
                      
                      {contact.officePhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{formatPhoneNumber(contact.officePhone)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nessun Contatto Trovato</h3>
              <p className="text-muted-foreground mb-4">
                Questa azienda non ha ancora contatti associati.
              </p>
              <div className="flex flex-col space-y-2 items-center justify-center">
                <Button onClick={() => {
                  // Apriamo direttamente il modale interno invece di navigare
                  setContactModalOpen(true);
                  setContactModalInitialData({
                    firstName: '',
                    lastName: '',
                    companyEmail: '',
                    areasOfActivity: [{
                      companyId: companyId,
                      companyName: company?.name || companyName,
                      isPrimary: true,
                      role: '',
                      jobDescription: `Works at ${company?.name || companyName}`
                    }]
                  });
                }}>
                  Crea Nuovo Contatto
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setModalOpen(true)}
                >
                  Associa Contatto Esistente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal per associare un contatto esistente */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associa Contatto a {companyName}</DialogTitle>
            <DialogDescription>
              Seleziona un contatto esistente da associare a questa azienda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="contactSelect">Seleziona Contatto</Label>
            <div className="mt-1">
              <AsyncSelect
                id="contactSelect"
                cacheOptions
                defaultOptions
                loadOptions={loadContactOptions}
                onChange={(selected: any) => {
                  if (selected) {
                    setSelectedContactId(selected.value);
                  } else {
                    setSelectedContactId(null);
                  }
                }}
                placeholder="Cerca contatto per nome..."
                noOptionsMessage={() => "Nessun contatto trovato"}
                loadingMessage={() => "Caricamento..."}
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--background)',
                    minHeight: '40px',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow)',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? 'var(--accent)' : 'transparent',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'var(--foreground)',
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'var(--foreground)',
                  }),
                }}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setModalOpen(false);
                setSelectedContactId(null);
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={associateContact}
              disabled={!selectedContactId || isContactLoading}
            >
              {isContactLoading ? "Associazione in corso..." : "Associa Contatto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal per creare un nuovo contatto */}
      <ContactModal 
        open={contactModalOpen} 
        onOpenChange={setContactModalOpen} 
        initialData={contactModalInitialData}
        onSuccess={() => {
          setContactModalOpen(false);
          refetchContacts(); // Ricarica la lista contatti
        }}
      />
    </>
  );
}