import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useContact } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, User, Building2, Mail, Phone, Calendar, Edit,
  Briefcase, MessageCircle, Clock, FileText, Trash, Linkedin,
  Facebook, Instagram, AlertCircle, CheckCircle, Link as LinkIcon,
  Handshake
} from "lucide-react";
import { formatDateToLocal, getInitials, formatPhoneNumber, generateAvatarColor } from "@/lib/utils";
import ContactModal from "@/components/modals/ContactModal";
import TaskList from "@/components/tasks/TaskList";
import { SynergiesList } from "@/components/synergies/SynergiesList";
import { Link } from "wouter";
import { LinkCompanyButton } from "@/components/forms/LinkCompanyButton";
import { useTranslation } from "react-i18next";
import { EntityEmailInbox } from "@/components/email/EntityEmailInbox";

export default function ContactDetail() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const contactId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  
  // Fetch contact data
  const { data: contact, isLoading, isError } = useContact(contactId);
  
  // Fetch related data
  const { companies } = useCompanies();
  const { deals: relatedDeals, isLoading: isLoadingDeals } = useDeals({ 
    contactId, 
    forContactDetail: true // Use the new specific endpoint for contact deals
  });
  
  // Helper functions
  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return null;
    if (!companies || !Array.isArray(companies)) return "Unknown Company";
    const company = companies.find(c => c && c.id === companyId);
    return company && company.name ? company.name : "Unknown Company";
  };
  
  const getPrimaryCompany = () => {
    if (!contact?.areasOfActivity || !Array.isArray(contact.areasOfActivity) || contact.areasOfActivity.length === 0) return null;
    
    // Find primary area of activity
    const primaryArea = contact.areasOfActivity.find(area => area && area.isPrimary);
    
    // If no primary, return the first one
    const firstArea = contact.areasOfActivity[0];
    
    const processArea = (area) => {
      if (!area) return null;
      
      // Se abbiamo il companyId, recuperiamo il nome dell'azienda dal nostro elenco delle compagnie
      const companyNameFromId = area.companyId ? getCompanyName(area.companyId) : null;
      
      return {
        id: area.companyId || null,
        name: area.companyName || companyNameFromId || "Company not specified",
        role: area.role || "No role specified",
        jobDescription: area.jobDescription || ""
      };
    };
    
    if (primaryArea) {
      return processArea(primaryArea);
    } else if (firstArea) {
      return processArea(firstArea);
    }
    
    return null;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/contacts")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('company.contacts.detail.back')}
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isError || !contact) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/contacts")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('company.contacts.detail.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('company.contacts.detail.contactNotFound')}</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-medium mb-2">{t('company.contacts.detail.contactNotFound')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('company.contacts.detail.contactNotFoundDescription')}
            </p>
            <Button onClick={() => navigate("/contacts")}>
              {t('company.contacts.detail.returnToContacts')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const primaryCompany = getPrimaryCompany();
  
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header with back button and contact name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/contacts")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('company.contacts.detail.back')}
          </Button>
          <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
          {primaryCompany?.role && (
            <Badge className="ml-2">{primaryCompany.role}</Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('company.contacts.detail.edit')}
          </Button>
          <Button variant="destructive" size="sm">
            <Trash className="h-4 w-4 mr-2" />
            {t('company.contacts.detail.delete')}
          </Button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">{t('company.contacts.detail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="companies">{t('company.contacts.detail.tabs.companies')}</TabsTrigger>
          <TabsTrigger value="deals">{t('company.contacts.detail.tabs.deals')}</TabsTrigger>
          <TabsTrigger value="synergies">{t('tab.synergies')}</TabsTrigger>
          <TabsTrigger value="activities">{t('company.contacts.detail.tabs.activities')}</TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Info Card */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2" />
                    {t('company.contacts.detail.contactDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className={`h-24 w-24 ${generateAvatarColor(contact.id)}`}>
                      <AvatarFallback className="text-lg">
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {primaryCompany && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {primaryCompany.role || t('company.contacts.noRoleSpecified')} {t('company.contacts.detail.at')}
                      </p>
                      <Link 
                        href={primaryCompany.id ? `/companies/${primaryCompany.id}` : "#"}
                        className="text-primary hover:underline font-medium"
                      >
                        {primaryCompany.name}
                      </Link>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {contact.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  
                  {contact.companyEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${contact.companyEmail}`} className="text-sm hover:underline">
                        {contact.companyEmail} ({t('company.contacts.detail.workEmail')})
                      </a>
                    </div>
                  )}
                  
                  {contact.privateEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${contact.privateEmail}`} className="text-sm hover:underline">
                        {contact.privateEmail} ({t('company.contacts.detail.personalEmail')})
                      </a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                        {formatPhoneNumber(contact.phone)} ({t('company.contacts.detail.officePhone')})
                      </a>
                    </div>
                  )}
                  
                  {contact.mobilePhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${contact.mobilePhone}`} className="text-sm hover:underline">
                        {formatPhoneNumber(contact.mobilePhone)} ({t('company.contacts.detail.mobilePhone')})
                      </a>
                    </div>
                  )}
                  
                  {contact.privatePhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${contact.privatePhone}`} className="text-sm hover:underline">
                        {formatPhoneNumber(contact.privatePhone)} ({t('company.contacts.detail.personalPhone')})
                      </a>
                    </div>
                  )}
                  
                  {contact.officePhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${contact.officePhone}`} className="text-sm hover:underline">
                        {formatPhoneNumber(contact.officePhone)} ({t('company.contacts.detail.officePhoneExt')})
                      </a>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Social Media Links */}
                  <div className="space-y-2">
                    {contact.linkedin && (
                      <div className="flex items-center">
                        <Linkedin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a 
                          href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    
                    {contact.facebook && (
                      <div className="flex items-center">
                        <Facebook className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a 
                          href={contact.facebook.startsWith('http') ? contact.facebook : `https://facebook.com/${contact.facebook}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          Facebook Profile
                        </a>
                      </div>
                    )}
                    
                    {contact.instagram && (
                      <div className="flex items-center">
                        <Instagram className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a 
                          href={contact.instagram.startsWith('http') ? contact.instagram : `https://instagram.com/${contact.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          Instagram Profile
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags if available */}
                  {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag || ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Job Description Card */}
              {primaryCompany?.jobDescription && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Briefcase className="h-5 w-5 mr-2" />
                      {t('company.contacts.detail.jobDescription')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{primaryCompany.jobDescription}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Related Deals Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Briefcase className="h-5 w-5 mr-2" />
                    {t('company.contacts.detail.deals')}
                  </CardTitle>
                  <CardDescription>
                    {t('company.contacts.detail.dealsAssociatedWith')} {contact.firstName} {contact.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDeals ? (
                    <Skeleton className="h-24 w-full" />
                  ) : Array.isArray(relatedDeals) && relatedDeals.length > 0 ? (
                    <div className="space-y-2">
                      {relatedDeals.slice(0, 3).map((deal) => (
                        <div key={deal?.id || 'unknown'} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <div>
                            <h4 className="font-medium">{deal?.name || t('company.contacts.detail.unnamedDeal')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('company.contacts.detail.value')}: ${deal?.value?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/deals/${deal?.id || 0}`)}
                          >
                            {t('company.contacts.detail.view')}
                          </Button>
                        </div>
                      ))}
                      
                      {Array.isArray(relatedDeals) && relatedDeals.length > 3 && (
                        <div className="text-center pt-2">
                          <Button variant="link" onClick={() => setActiveTab("deals")}>
                            {t('company.contacts.detail.viewAllDeals', { count: relatedDeals.length })}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Briefcase className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                      <p className="text-muted-foreground mb-4">{t('company.contacts.detail.noDealsAssociated')}</p>
                      <Button onClick={() => navigate(`/deals/new?contactId=${contactId}`)}>
                        {t('company.contacts.detail.createNewDeal')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes Card */}
              {contact.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="h-5 w-5 mr-2" />
                      {t('company.contacts.detail.notes')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{contact.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Synergies Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Handshake className="h-5 w-5 mr-2" />
                    {t('synergies.business_synergies')}
                  </CardTitle>
                  <CardDescription>
                    {t('synergies.special_relationships')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SynergiesList 
                    entityId={contactId} 
                    entityType="contact"
                    showTitle={false}
                  />
                </CardContent>
              </Card>
              
              {/* Task List Component */}
              <TaskList 
                entityId={contactId} 
                entityType="contact" 
                title={t('tab.tasks')}
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Areas of Activity
              </CardTitle>
              <CardDescription>
                Companies and roles associated with {contact.firstName} {contact.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contact.areasOfActivity && contact.areasOfActivity.length > 0 ? (
                <div className="space-y-6">
                  {contact.areasOfActivity.map((area) => {
                    const companyName = area.companyName || getCompanyName(area.companyId) || "Unknown Company";
                    
                    return (
                      <Card key={area.id} className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="font-medium text-lg">
                                  {companyName}
                                </h3>
                                {area.isPrimary && (
                                  <Badge className="ml-2" variant="secondary">Primary</Badge>
                                )}
                              </div>
                              
                              {area.role && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {area.role}
                                </p>
                              )}
                              
                              {area.jobDescription && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium mb-1">Job Description:</h4>
                                  <p className="text-sm">{area.jobDescription}</p>
                                </div>
                              )}
                            </div>
                            
                            {area.companyId && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/companies/${area.companyId}`)}
                              >
                                <Building2 className="h-4 w-4 mr-2" />
                                View Company
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Companies Associated</h3>
                  <p className="text-muted-foreground mb-4">
                    This contact is not associated with any companies yet.
                  </p>
                  <div className="flex flex-col space-y-2 items-center justify-center">
                    <Button onClick={() => setShowModal(true)}>
                      Add Company Association
                    </Button>
                    <LinkCompanyButton 
                      contactId={contactId} 
                      onSuccess={() => {
                        // Refresh the contact data
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Synergies Tab */}
        <TabsContent value="synergies" className="space-y-6">
          <div className="bg-white p-6 rounded-md shadow-sm">
            <SynergiesList entityId={contactId} entityType="contact" />
          </div>
        </TabsContent>
        
        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Deals
              </CardTitle>
              <CardDescription>
                Deals and opportunities associated with {contact.firstName} {contact.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDeals ? (
                <Skeleton className="h-48 w-full" />
              ) : Array.isArray(relatedDeals) && relatedDeals.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Deal Name</th>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Value</th>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Company</th>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Stage</th>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Expected Close</th>
                          <th className="text-left font-medium text-sm text-muted-foreground p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedDeals.map((deal) => deal ? (
                          <tr key={deal.id || 'unknown-deal'} className="hover:bg-muted/50">
                            <td className="p-2 font-medium">{deal.name || 'Unnamed Deal'}</td>
                            <td className="p-2">${deal.value?.toLocaleString() || '0'}</td>
                            <td className="p-2">{getCompanyName(deal.companyId) || "-"}</td>
                            <td className="p-2">{deal.stageName || 'No Stage'}</td>
                            <td className="p-2">
                              {deal.expectedCloseDate ? (
                                formatDateToLocal(new Date(deal.expectedCloseDate))
                              ) : "-"}
                            </td>
                            <td className="p-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate(`/deals/${deal.id || 0}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ) : null)}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => navigate(`/deals/new?contactId=${contactId}`)}>
                      Add New Deal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Deals Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no deals associated with this contact yet.
                  </p>
                  <Button onClick={() => navigate(`/deals/new?contactId=${contactId}`)}>
                    Create New Deal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <EntityEmailInbox
            entityId={contactId}
            entityType="contact"
            entityName={`${contact.firstName} ${contact.lastName}`}
            entityEmail={contact.email || contact.companyEmail || contact.privateEmail}
          />
        </TabsContent>
      </Tabs>
      
      {/* Edit Contact Modal */}
      {showModal && (
        <ContactModal
          open={showModal}
          onOpenChange={setShowModal}
          initialData={contact}
        />
      )}
    </div>
  );
}