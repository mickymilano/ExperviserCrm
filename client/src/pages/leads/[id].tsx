import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, User, Building2, Mail, Phone, Calendar, Edit,
  FileText, Clock, AlertCircle, CheckCircle, Trash,
} from "lucide-react";
import { formatDateToLocal, formatPhoneNumber } from "@/lib/utils";
import { useLead, useConvertLeadToContact } from "@/hooks/useLeads";
import LeadModal from "@/components/modals/LeadModal";
import TaskList from "@/components/tasks/TaskList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function LeadDetail() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const leadId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const { t } = useTranslation();
  
  // Fetch lead data
  const { data: lead, isLoading, isError } = useLead(leadId);
  const convertLeadMutation = useConvertLeadToContact();
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/leads")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('lead.detail.back')}
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isError || !lead) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/leads")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('lead.detail.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('lead.detail.notFound')}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-2" />
            <p className="mb-4">{t('lead.detail.notFoundDescription')}</p>
            <Button onClick={() => navigate("/leads")}>{t('lead.detail.returnToLeads')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const leadName = lead.companyName || `${lead.firstName} ${lead.lastName}`;
  const getInitials = () => {
    if (lead.companyName) {
      return lead.companyName.substring(0, 2).toUpperCase();
    } else if (lead.firstName && lead.lastName) {
      return `${lead.firstName[0]}${lead.lastName[0]}`.toUpperCase();
    } else if (lead.firstName) {
      return lead.firstName.substring(0, 2).toUpperCase();
    } else {
      return "LD";
    }
  };
  
  const handleConvertToContact = () => {
    if (!lead) return;
    
    convertLeadMutation.mutate(
      { leadId },
      {
        onSuccess: () => {
          toast({
            title: t('lead.detail.success'),
            description: t('lead.detail.convertSuccess')
          });
          // Navigate to contacts page
          navigate("/contacts");
        }
      }
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/leads")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('lead.detail.back')}
          </Button>
          <h1 className="text-2xl font-bold">{leadName}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('lead.detail.edit')}
          </Button>
          <Button variant="outline" onClick={handleConvertToContact}>
            <User className="h-4 w-4 mr-2" />
            {t('lead.detail.convertToContact')}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">{t('lead.detail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="activities">{t('lead.detail.tabs.activities')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold mb-1">{leadName}</h2>
                    <Badge variant={lead.status === "Qualified" ? "success" : lead.status === "Unqualified" ? "destructive" : "default"}>
                      {lead.status || "New"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('lead.detail.fields.addedOn')} {formatDateToLocal(lead.createdAt)}
                    </p>
                    
                    <Separator className="my-4" />
                    
                    <div className="w-full space-y-3 text-left">
                      {lead.email && (
                        <div className="flex items-start">
                          <Mail className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t('lead.detail.fields.email')}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {lead.phone && (
                        <div className="flex items-start">
                          <Phone className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t('lead.detail.fields.phone')}</p>
                            <p className="text-sm text-muted-foreground">{formatPhoneNumber(lead.phone)}</p>
                          </div>
                        </div>
                      )}
                      
                      {lead.jobTitle && (
                        <div className="flex items-start">
                          <Building2 className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t('lead.detail.fields.jobTitle')}</p>
                            <p className="text-sm text-muted-foreground">{lead.jobTitle}</p>
                          </div>
                        </div>
                      )}
                      
                      {lead.source && (
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t('lead.detail.fields.source')}</p>
                            <p className="text-sm text-muted-foreground">{lead.source}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {lead.tags && lead.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    {lead.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="bg-primary/10">
                        {tag}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* Notes Card */}
              {lead.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="h-5 w-5 mr-2" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Task List Component */}
              <TaskList 
                entityId={leadId} 
                entityType="lead" 
                title="Tasks"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                A history of all interactions with this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activity recorded yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showEditModal && (
        <LeadModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          initialData={lead}
        />
      )}
    </div>
  );
}