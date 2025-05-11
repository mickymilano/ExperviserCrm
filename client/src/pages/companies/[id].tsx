import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useCompany } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, Building, Mail, Phone, Globe, MapPin, 
  Edit, Trash, Users, FileText, PenTool, Plus,
  Briefcase, Clock, CheckCircle, AlertCircle, Inbox,
  Calendar, Flag, Hash, Money, DollarSign, Award, MapPinned
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPhoneNumber } from "@/lib/utils";
import CompanyEditForm from "@/components/forms/CompanyEditForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TaskList from "@/components/tasks/TaskList";
import ContactModal from "@/components/modals/ContactModal";

export default function CompanyDetail() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const companyId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Fetch company data
  const { data: company, isLoading, isError, error } = useCompany(companyId);
  
  // Fetch related contacts
  const { contacts } = useContacts({ companyId });
  
  // Fetch related deals
  const { deals, isLoading: isLoadingDeals } = useDeals({ 
    companyId,
    forCompanyDetail: true // Use the new specific endpoint for company deals
  });
  
  // Group deals by status
  const dealsByStatus = deals?.reduce((groups, deal) => {
    const status = deal.status || "Other";
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(deal);
    return groups;
  }, {}) || {};
  
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/companies")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
  
  if (isError || !company) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/companies")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Company Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-medium mb-2">Company Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The company you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => navigate("/companies")}>
              Return to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header with back button and company name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/companies")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          {company.industry && (
            <Badge className="ml-2" variant="outline">{company.industry}</Badge>
          )}
        </div>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Company
              </Button>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {isEditing && (
            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
              Cancel Editing
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-fit mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Company Details</CardTitle>
                <CardDescription>Make changes to the company information below</CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyEditForm 
                  company={company} 
                  onComplete={() => setIsEditing(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Details
                </CardTitle>
              </CardHeader>
              
              {/* Basic Information Section */}
              <CardContent>
                <h3 className="text-md font-medium mb-4 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Building className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">Industry</p>
                        <p>{company.industry || "Not specified"}</p>
                      </div>
                    </div>
                    
                    {company.customFields?.size && (
                      <div className="flex items-start">
                        <Users className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Company Size</p>
                          <p>{company.customFields.size}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.customFields?.yearFounded && (
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Year Founded</p>
                          <p>{company.customFields.yearFounded}</p>
                        </div>
                      </div>
                    )}
                    
                    {company.customFields?.revenue && (
                      <div className="flex items-start">
                        <DollarSign className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Annual Revenue</p>
                          <p>{company.customFields.revenue}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Contact Information Section */}
                <h3 className="text-md font-medium mb-4 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    {company.email && (
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Email</p>
                          <a 
                            href={`mailto:${company.email}`} 
                            className="text-primary hover:underline"
                          >
                            {company.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Phone</p>
                          <p>{formatPhoneNumber(company.phone)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.website && (
                      <div className="flex items-start">
                        <Globe className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Website</p>
                          <a 
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Location Section */}
                <h3 className="text-md font-medium mb-4 flex items-center">
                  <MapPinned className="h-4 w-4 mr-2 text-muted-foreground" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    {company.customFields?.country && (
                      <div className="flex items-start">
                        <Flag className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Country</p>
                          <p>{company.customFields.country}</p>
                        </div>
                      </div>
                    )}
                    
                    {company.customFields?.city && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">City</p>
                          <p>{company.customFields.city}</p>
                        </div>
                      </div>
                    )}
                    
                    {company.customFields?.timezone && (
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Timezone</p>
                          <p>{company.customFields.timezone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.address && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Address</p>
                          <p className="whitespace-pre-line">{company.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Administrative Details Section */}
                <h3 className="text-md font-medium mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Administrative Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    {company.customFields?.vatNumber && (
                      <div className="flex items-start">
                        <Hash className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">VAT/Tax Number</p>
                          <p>{company.customFields.vatNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.customFields?.registrationNumber && (
                      <div className="flex items-start">
                        <Hash className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Registration Number</p>
                          <p>{company.customFields.registrationNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tags Section */}
                {company.tags && company.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {company.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {/* Notes Section */}
              {company.notes && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="flex items-start">
                      <PenTool className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-2">Notes</p>
                        <p className="whitespace-pre-line">{company.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Contacts</p>
                  <p className="text-2xl font-bold">{contacts?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground opacity-80" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Open Deals</p>
                  <p className="text-2xl font-bold">{deals?.filter(d => d.status !== 'Closed Won' && d.status !== 'Closed Lost').length || 0}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground opacity-80" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Deal Value</p>
                  <p className="text-2xl font-bold">${deals?.reduce((sum, deal) => sum + (deal.value || 0), 0).toLocaleString()}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground opacity-80" />
              </CardContent>
            </Card>
            
            {/* Task List Component */}
            <TaskList 
              entityId={companyId} 
              entityType="company" 
              title="Tasks"
            />
          </div>
        </TabsContent>
        
        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Contacts ({contacts?.length || 0})
                </CardTitle>
                <CardDescription>
                  People associated with {company.name}
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsContactModalOpen(true)} 
                size="sm"
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-6">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {contact.areasOfActivity?.find(a => a.companyId === company.id)?.role || "No role specified"}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/contacts/${contact.id}`)}>
                            View Profile
                          </Button>
                        </div>
                        
                        {contact.areasOfActivity?.find(a => a.companyId === company.id)?.jobDescription && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Job Description: </span>
                              {contact.areasOfActivity.find(a => a.companyId === company.id).jobDescription}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {contact.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{formatPhoneNumber(contact.phone)}</span>
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
                  <h3 className="text-lg font-medium mb-2">No Contacts Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no contacts associated with this company yet.
                  </p>
                  <Button onClick={() => navigate("/contacts/new?companyId=" + company.id)}>
                    Add New Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Deals ({deals?.length || 0})
              </CardTitle>
              <CardDescription>
                Deals and opportunities associated with {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deals && deals.length > 0 ? (
                <div className="space-y-8">
                  {Object.keys(dealsByStatus).map((status) => (
                    <div key={status} className="space-y-4">
                      <div className="flex items-center">
                        <h3 className="font-medium text-lg">{status}</h3>
                        <Badge className="ml-2">{dealsByStatus[status].length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {dealsByStatus[status].map((deal) => (
                          <Card key={deal.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{deal.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    ${deal.value?.toLocaleString() || 0}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => navigate(`/deals/${deal.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                              {deal.expectedCloseDate && (
                                <div className="flex items-center text-sm text-muted-foreground mt-2">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  <span>Expected close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Deals Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no deals associated with this company yet.
                  </p>
                  <Button onClick={() => navigate("/deals/new?companyId=" + company.id)}>
                    Add New Deal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest activities related to {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder - would fetch activities from an API endpoint */}
              <div className="text-center py-8">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Recent Activities</h3>
                <p className="text-muted-foreground">
                  No activities have been logged for this company yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}